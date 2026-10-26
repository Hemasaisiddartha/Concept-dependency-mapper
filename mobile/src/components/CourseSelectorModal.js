import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { generateMobileAICurriculum } from '../services/api';

export default function CourseSelectorModal({
  visible,
  onClose,
  courses,
  selectedCourseId,
  onSelectCourse,
  currentUserId,
  onRefreshCourses
}) {
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' or 'create'
  const [topicInput, setTopicInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Computer Science');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState(null);

  const handleGenerate = async () => {
    if (!topicInput.trim()) return;
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await generateMobileAICurriculum(
        topicInput.trim(),
        categoryInput.trim() || 'Computer Science',
        currentUserId || 1
      );
      if (res && res.id) {
        if (onRefreshCourses) await onRefreshCourses();
        onSelectCourse(res.id);
        setTopicInput('');
        onClose();
      } else {
        setGenError('Failed to generate curriculum. Check backend status.');
      }
    } catch (err) {
      setGenError(err.response?.data?.detail || 'Curriculum generation error. Backend reached timeout.');
    } finally {
      setIsGenerating(false);
    }
  };

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
            <View>
              <Text style={styles.headerTag}>CURRICULUM REPOSITORY</Text>
              <Text style={styles.headerTitle}>Select or Generate Course</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Mode Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'browse' && styles.tabBtnActive]}
              onPress={() => setActiveTab('browse')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'browse' && styles.tabBtnTextActive]}>
                Courses ({courses?.length || 0})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'create' && styles.tabBtnActive]}
              onPress={() => setActiveTab('create')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'create' && styles.tabBtnTextActive]}>
                ✨ AI Course Generator
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'browse' ? (
            <ScrollView style={styles.bodyList} contentContainerStyle={{ paddingBottom: 20 }}>
              {courses && courses.length > 0 ? (
                courses.map((c) => {
                  const isSelected = c.id === selectedCourseId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.courseCard, isSelected && styles.courseCardSelected]}
                      onPress={() => {
                        onSelectCourse(c.id);
                        onClose();
                      }}
                    >
                      <View style={styles.courseCardHeader}>
                        <Text style={styles.courseCode}>{c.code}</Text>
                        {isSelected && (
                          <View style={styles.activePill}>
                            <Text style={styles.activePillText}>ACTIVE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.courseTitle}>{c.title}</Text>
                      <Text style={styles.courseDesc} numberOfLines={2}>{c.description}</Text>
                      <View style={styles.courseMetaRow}>
                        <Text style={styles.courseMeta}>📚 {c.total_concepts || 0} Concepts</Text>
                        <Text style={styles.courseMeta}>🔗 {c.total_dependencies || 0} Prereqs</Text>
                        <Text style={styles.courseMeta}>⏱️ ~{c.estimated_hours || 40}h</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No courses found in database.</Text>
                </View>
              )}
            </ScrollView>
          ) : (
            <ScrollView style={styles.bodyList} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.aiGenCard}>
                <Text style={styles.aiGenTitle}>Instant Topic Graph Synthesizer</Text>
                <Text style={styles.aiGenSubtitle}>
                  Enter any domain or subject. The backend AI synthesizes an adaptive prerequisite DAG with 20-question micro-quizzes into the shared database.
                </Text>

                {genError && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {genError}</Text>
                  </View>
                )}

                <Text style={styles.inputLabel}>Course Topic or Subject</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Distributed Systems, Neural Networks, Organic Chemistry"
                  placeholderTextColor="#64748b"
                  value={topicInput}
                  onChangeText={setTopicInput}
                  editable={!isGenerating}
                />

                <Text style={styles.inputLabel}>Domain / Category</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Computer Science, Mathematics, Biology"
                  placeholderTextColor="#64748b"
                  value={categoryInput}
                  onChangeText={setCategoryInput}
                  editable={!isGenerating}
                />

                <TouchableOpacity
                  style={[styles.genButton, (!topicInput.trim() || isGenerating) && { opacity: 0.6 }]}
                  onPress={handleGenerate}
                  disabled={!topicInput.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.genButtonText}>Synthesizing Knowledge DAG...</Text>
                    </View>
                  ) : (
                    <Text style={styles.genButtonText}>🚀 Generate Full Curriculum with AI</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.suggestionRow}>
                  <Text style={styles.suggestLabel}>Quick Ideas:</Text>
                  {['Algorithms', 'Calculus', 'Quantum Computing', 'Transformers'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={styles.suggestChip}
                      onPress={() => setTopicInput(t)}
                    >
                      <Text style={styles.suggestChipText}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

              </View>
            </ScrollView>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0a0e1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: '85%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#818cf8',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
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
    marginBottom: 14,
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
  bodyList: {
    maxHeight: 460,
  },
  courseCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  courseCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  courseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 10,
    fontWeight: '800',
    color: '#818cf8',
    letterSpacing: 0.8,
  },
  activePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activePillText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '800',
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  courseDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
    marginBottom: 8,
  },
  courseMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  courseMeta: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  aiGenCard: {
    padding: 6,
  },
  aiGenTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  aiGenSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 12,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 11,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 12,
  },
  genButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  genButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 16,
  },
  suggestLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
  },
  suggestChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  suggestChipText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: '600',
  },
});
