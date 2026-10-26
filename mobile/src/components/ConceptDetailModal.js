import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { getMobileConceptDeepBriefing } from '../services/api';

export default function ConceptDetailModal({
  visible,
  conceptNode,
  onClose,
  onStartQuiz,
  onAskAITutor,
  onTargetPathway
}) {
  const [briefing, setBriefing] = useState(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'briefing'

  useEffect(() => {
    if (visible && conceptNode) {
      setActiveTab('overview');
      setLoadingBriefing(true);
      getMobileConceptDeepBriefing(conceptNode.id)
        .then((data) => {
          setBriefing(data);
        })
        .finally(() => {
          setLoadingBriefing(false);
        });
    } else {
      setBriefing(null);
    }
  }, [visible, conceptNode]);

  if (!conceptNode) return null;

  const isMastered = conceptNode.status === 'MASTERED';
  const isReady = conceptNode.status === 'READY';
  const isLocked = conceptNode.status === 'LOCKED';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <View style={styles.tagRow}>
                <Text style={styles.codeTag}>{conceptNode.code}</Text>
                <View style={[
                  styles.statusBadge,
                  isMastered && { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: 'rgba(16, 185, 129, 0.4)' },
                  isReady && { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: 'rgba(245, 158, 11, 0.4)' },
                  isLocked && { backgroundColor: 'rgba(100, 116, 139, 0.2)', borderColor: 'rgba(100, 116, 139, 0.4)' },
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    isMastered && { color: '#34d399' },
                    isReady && { color: '#fbbf24' },
                    isLocked && { color: '#94a3b8' }
                  ]}>
                    {isMastered ? '✓ Mastered' : (isReady ? '⚡ Ready for Quiz' : '🔒 Locked Prereqs')}
                  </Text>
                </View>
              </View>
              <Text style={styles.title} numberOfLines={2}>{conceptNode.title}</Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Subtabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'overview' && styles.tabBtnActive]}
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'overview' && styles.tabBtnTextActive]}>
                Overview
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'briefing' && styles.tabBtnActive]}
              onPress={() => setActiveTab('briefing')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'briefing' && styles.tabBtnTextActive]}>
                📖 Google Master Briefing
              </Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView style={styles.bodyScroll} contentContainerStyle={{ paddingBottom: 20 }}>
            {activeTab === 'overview' ? (
              <View>
                {/* Meta Grid */}
                <View style={styles.metaGrid}>
                  <View style={styles.metaCell}>
                    <Text style={styles.metaLabel}>BLOOM LEVEL</Text>
                    <Text style={styles.metaValue}>{conceptNode.bloom_level || 'Analyze'}</Text>
                  </View>
                  <View style={styles.metaCell}>
                    <Text style={styles.metaLabel}>DIFFICULTY</Text>
                    <Text style={styles.metaValue}>{conceptNode.difficulty}/5</Text>
                  </View>
                  <View style={styles.metaCell}>
                    <Text style={styles.metaLabel}>EST. TIME</Text>
                    <Text style={styles.metaValue}>~{conceptNode.estimated_minutes || 45} mins</Text>
                  </View>
                  <View style={styles.metaCell}>
                    <Text style={styles.metaLabel}>MASTERY SCORE</Text>
                    <Text style={[styles.metaValue, { color: '#34d399' }]}>
                      {Math.round((conceptNode.mastery_score || 0) * 100)}%
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionHeading}>CONCEPT DESCRIPTION</Text>
                  <Text style={styles.paragraph}>{conceptNode.description}</Text>
                </View>

                {/* Practical Example */}
                {conceptNode.practical_example ? (
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionHeading}>PRACTICAL WORKED EXAMPLE</Text>
                    <View style={styles.codeBox}>
                      <Text style={styles.codeSnippet}>{conceptNode.practical_example}</Text>
                    </View>
                  </View>
                ) : null}

                {/* Prerequisites info */}
                {conceptNode.prerequisites && conceptNode.prerequisites.length > 0 && (
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionHeading}>DIRECT PREREQUISITES ({conceptNode.prerequisites.length})</Text>
                    <View style={{ gap: 6, marginTop: 4 }}>
                      {conceptNode.prerequisites.map((pId) => (
                        <View key={pId} style={styles.prereqTag}>
                          <Text style={styles.prereqTagText}>🔗 Required Concept ID #{pId}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ) : (
              /* Deep Google Briefing View */
              <View>
                {loadingBriefing ? (
                  <View style={styles.centerBox}>
                    <ActivityIndicator size="small" color="#6366f1" />
                    <Text style={styles.loadingText}>Fetching 360° Google Master Knowledge...</Text>
                  </View>
                ) : briefing ? (
                  <View style={{ gap: 14 }}>
                    {briefing.mental_model && (
                      <View style={styles.briefingCard}>
                        <Text style={styles.briefingCardTag}>🧠 MENTAL MODEL</Text>
                        <Text style={styles.paragraph}>{briefing.mental_model}</Text>
                      </View>
                    )}

                    {briefing.core_theorems && (
                      <View style={styles.briefingCard}>
                        <Text style={styles.briefingCardTag}>📐 MATHEMATICAL RULES & THEOREMS</Text>
                        <Text style={styles.paragraph}>{briefing.core_theorems}</Text>
                      </View>
                    )}

                    {briefing.misconceptions && (
                      <View style={[styles.briefingCard, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                        <Text style={[styles.briefingCardTag, { color: '#f87171' }]}>⚠️ COMMON PITFALLS & MISCONCEPTIONS</Text>
                        <Text style={styles.paragraph}>{briefing.misconceptions}</Text>
                      </View>
                    )}

                    {briefing.industry_scale_applications && (
                      <View style={styles.briefingCard}>
                        <Text style={styles.briefingCardTag}>🏭 REAL-WORLD INDUSTRY APPLICATIONS</Text>
                        <Text style={styles.paragraph}>{briefing.industry_scale_applications}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.centerBox}>
                    <Text style={styles.emptyText}>Google Master Briefing ready on backend.</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Sticky Bottom Actions */}
          <View style={styles.actionsBar}>
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => {
                onClose();
                onStartQuiz(conceptNode.id);
              }}
            >
              <Text style={styles.actionBtnPrimaryText}>⚡ Start Micro-Quiz</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={() => {
                onClose();
                onAskAITutor(conceptNode.id, conceptNode.title);
              }}
            >
              <Text style={styles.actionBtnSecondaryText}>🤖 Ask AI Tutor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={() => {
                onClose();
                onTargetPathway(conceptNode.id);
              }}
            >
              <Text style={styles.actionBtnOutlineText}>📍 Prereq Chain</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0a0e1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    maxHeight: '90%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  codeTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#818cf8',
    letterSpacing: 0.8,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 22,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#6366f1',
  },
  tabBtnText: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 12,
  },
  tabBtnTextActive: {
    color: '#ffffff',
  },
  bodyScroll: {
    maxHeight: 400,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  metaCell: {
    width: '50%',
    padding: 6,
  },
  metaLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  sectionBlock: {
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 9,
    fontWeight: '800',
    color: '#818cf8',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  codeBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  codeSnippet: {
    fontFamily: 'monospace',
    color: '#38bdf8',
    fontSize: 11,
    lineHeight: 16,
  },
  prereqTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  prereqTagText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '600',
  },
  briefingCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  briefingCardTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  centerBox: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 8,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 6,
  },
  actionBtnPrimary: {
    flex: 1.2,
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnSecondaryText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnOutline: {
    flex: 0.9,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnOutlineText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
});
