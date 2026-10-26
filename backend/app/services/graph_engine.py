from typing import List, Dict, Set, Tuple, Any, Optional
import networkx as nx
from sqlalchemy.orm import Session
from app.models.models import ConceptNode, ConceptDependency, StudentMastery

class ConceptGraphEngine:
    """
    Core Graph Engine utilizing NetworkX for:
    - Directed Acyclic Graph (DAG) validation & topological sorting
    - Prerequisite dependency resolution & gap analysis
    - Student readiness evaluation & personalized adaptive path generation
    - Bottleneck node detection
    """

    def __init__(self, db: Session, course_id: int):
        self.db = db
        self.course_id = course_id
        self.graph = nx.DiGraph()
        self.nodes_data: Dict[int, ConceptNode] = {}
        self.dependencies_data: List[ConceptDependency] = []
        self._build_graph()

    def _build_graph(self):
        nodes = self.db.query(ConceptNode).filter(ConceptNode.course_id == self.course_id).all()
        dependencies = self.db.query(ConceptDependency).filter(ConceptDependency.course_id == self.course_id).all()

        for node in nodes:
            self.nodes_data[node.id] = node
            self.graph.add_node(
                node.id,
                code=node.code,
                title=node.title,
                difficulty=node.difficulty,
                estimated_minutes=node.estimated_minutes,
                importance_weight=node.importance_weight,
                category=node.category,
                bloom_level=node.bloom_level,
                order_index=node.order_index
            )

        for dep in dependencies:
            self.dependencies_data.append(dep)
            self.graph.add_edge(
                dep.source_concept_id,
                dep.target_concept_id,
                id=dep.id,
                dependency_type=dep.dependency_type,
                strength_weight=dep.strength_weight,
                explanation=dep.explanation
            )

    def is_dag(self) -> bool:
        return nx.is_directed_acyclic_graph(self.graph)

    def get_topological_order(self) -> List[int]:
        if not self.is_dag():
            return list(self.nodes_data.keys())
        return list(nx.topological_sort(self.graph))

    def get_direct_prerequisites(self, concept_id: int) -> List[int]:
        if concept_id not in self.graph:
            return []
        return list(self.graph.predecessors(concept_id))

    def get_all_ancestor_prerequisites(self, concept_id: int) -> Set[int]:
        if concept_id not in self.graph:
            return set()
        return nx.ancestors(self.graph, concept_id)

    def get_direct_dependents(self, concept_id: int) -> List[int]:
        if concept_id not in self.graph:
            return []
        return list(self.graph.successors(concept_id))

    def get_all_descendant_dependents(self, concept_id: int) -> Set[int]:
        if concept_id not in self.graph:
            return set()
        return nx.descendants(self.graph, concept_id)

    def calculate_node_statuses(self, user_id: int) -> Dict[int, Dict[str, Any]]:
        if not self.nodes_data:
            return {}

        masteries = self.db.query(StudentMastery).filter(
            StudentMastery.user_id == user_id,
            StudentMastery.concept_id.in_(list(self.nodes_data.keys()))
        ).all()
        
        mastery_map: Dict[int, float] = {m.concept_id: m.mastery_score for m in masteries}
        status_override: Dict[int, str] = {m.concept_id: m.status for m in masteries}

        results: Dict[int, Dict[str, Any]] = {}
        for node_id, node in self.nodes_data.items():
            mastery_score = mastery_map.get(node_id, 0.0)
            direct_prereqs = self.get_direct_prerequisites(node_id)
            
            # Check hard prerequisites
            missing_prereqs = []
            for p_id in direct_prereqs:
                p_mastery = mastery_map.get(p_id, 0.0)
                # If dependency is hard prerequisite and mastery < 0.75, it's missing
                edge_data = self.graph.get_edge_data(p_id, node_id)
                dep_type = edge_data.get("dependency_type", "HARD_PREREQUISITE") if edge_data else "HARD_PREREQUISITE"
                if dep_type == "HARD_PREREQUISITE" and p_mastery < 0.75:
                    missing_prereqs.append(self.nodes_data[p_id].title)

            prerequisites_met = len(missing_prereqs) == 0

            # Determine dynamic state
            if mastery_score >= 0.75:
                status = "MASTERED"
            elif status_override.get(node_id) == "NEEDS_REMEDIATION":
                status = "NEEDS_REMEDIATION"
            elif not prerequisites_met:
                status = "LOCKED"
            elif mastery_score > 0.1:
                status = "IN_PROGRESS"
            else:
                status = "READY"

            results[node_id] = {
                "id": node_id,
                "code": node.code,
                "title": node.title,
                "category": node.category,
                "difficulty": node.difficulty,
                "estimated_minutes": node.estimated_minutes,
                "bloom_level": node.bloom_level,
                "status": status,
                "mastery_score": round(mastery_score, 2),
                "order_index": node.order_index,
                "in_degree": self.graph.in_degree(node_id),
                "out_degree": self.graph.out_degree(node_id),
                "prerequisites_met": prerequisites_met,
                "missing_prerequisites": missing_prereqs
            }
        return results

    def find_bottlenecks(self) -> List[int]:
        """Nodes that block the greatest number of downstream concepts."""
        bottleneck_scores = []
        for node_id in self.nodes_data.keys():
            descendants = self.get_all_descendant_dependents(node_id)
            out_deg = self.graph.out_degree(node_id)
            score = len(descendants) * 2 + out_deg
            bottleneck_scores.append((node_id, score))
        
        bottleneck_scores.sort(key=lambda x: x[1], reverse=True)
        return [node_id for node_id, score in bottleneck_scores if score > 3]

    def generate_adaptive_path(self, user_id: int, target_concept_id: int) -> Dict[str, Any]:
        """
        Calculates the optimal topological subpath required to master the target concept,
        filtering out already mastered concepts and prioritizing unmet prerequisites.
        """
        if target_concept_id not in self.graph:
            return {"error": "Target concept not found"}

        node_statuses = self.calculate_node_statuses(user_id)
        ancestors = self.get_all_ancestor_prerequisites(target_concept_id)
        relevant_nodes = ancestors.union({target_concept_id})

        # Induce subgraph of relevant nodes
        subgraph = self.graph.subgraph(relevant_nodes)
        topo_order = list(nx.topological_sort(subgraph)) if nx.is_directed_acyclic_graph(subgraph) else list(relevant_nodes)

        bottlenecks = set(self.find_bottlenecks())
        path_nodes = []
        total_time = 0
        gaps = []

        for node_id in topo_order:
            status_info = node_statuses.get(node_id, {})
            node = self.nodes_data[node_id]
            is_mastered = status_info.get("status") == "MASTERED"
            is_bottleneck = node_id in bottlenecks

            if not is_mastered:
                total_time += node.estimated_minutes
                if status_info.get("status") in ["LOCKED", "NEEDS_REMEDIATION"]:
                    gaps.append(node.title)

                action = "Study & Take Diagnostic Quiz"
                if status_info.get("status") == "READY":
                    action = "Immediate Next Step (Ready to Learn)"
                elif status_info.get("status") == "IN_PROGRESS":
                    action = "Resume Learning Session"
                elif status_info.get("status") == "LOCKED":
                    action = f"Blocked by {', '.join(status_info.get('missing_prerequisites', []))}"

                path_nodes.append({
                    "concept_id": node_id,
                    "title": node.title,
                    "code": node.code,
                    "difficulty": node.difficulty,
                    "estimated_minutes": node.estimated_minutes,
                    "status": status_info.get("status", "LOCKED"),
                    "mastery_score": status_info.get("mastery_score", 0.0),
                    "is_bottleneck": is_bottleneck,
                    "recommended_action": action
                })

        target_node = self.nodes_data[target_concept_id]
        strategy = (
            f"AI Adaptive Path: To master '{target_node.title}', complete {len(path_nodes)} targeted concept(s). "
            f"Estimated dynamic learning time: {total_time} mins compared to traditional linear curriculum time: "
            f"{sum(n.estimated_minutes for n in self.nodes_data.values() if n.order_index <= target_node.order_index)} mins."
        )

        return {
            "target_concept_id": target_concept_id,
            "target_concept_title": target_node.title,
            "user_id": user_id,
            "estimated_total_time_minutes": total_time,
            "path_nodes": path_nodes,
            "identified_gaps": gaps,
            "ai_strategy_summary": strategy
        }
