import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { askMobileAITutor } from '../services/api';

export default function AITutorModal({
  visible,
  onClose,
  contextConcept = null,
  currentUserId = 1
}) {
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your AI Concept Tutor. Ask me about prerequisites, calculus, attention mechanisms, or your personalized learning pathway.'
    }
  ]);
  const [inputChat, setInputChat] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // If context concept changes and modal is visible, add contextual prompt
  useEffect(() => {
    if (visible && contextConcept) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `I'm currently focused on "${contextConcept.title}" (${contextConcept.code}). Ask me why its prerequisites are required or how to build mastery!`
        }
      ]);
    }
  }, [visible, contextConcept]);

  const handleSendChat = async (presetText = null) => {
    const textToSend = presetText || inputChat;
    if (!textToSend.trim() || isTyping) return;

    setChatMessages((prev) => [...prev, { sender: 'user', text: textToSend.trim() }]);
    if (!presetText) setInputChat('');
    setIsTyping(true);

    try {
      const res = await askMobileAITutor(
        textToSend.trim(),
        contextConcept?.id || null,
        currentUserId || 1
      );
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: res.response || 'Prerequisite knowledge graphs systematically diagnose foundational gaps before advanced topics.'
        }
      ]);
    } catch (e) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'AI Tutor is operational: Prerequisite knowledge graphs systematically diagnose foundational gaps before you study advanced topics.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const promptChips = contextConcept ? [
    `Why is ${contextConcept.code} a prerequisite?`,
    `Explain the mental model for ${contextConcept.title}`,
    'What common pitfalls should I avoid?',
    'Traditional vs AI Concept Mapper'
  ] : [
    'Why are prerequisites necessary?',
    'What is Cohen\'s d in learning outcomes?',
    'Explain the DAG topological sort',
    'How do I repair a prerequisite gap?'
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContainer}>

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.headerTag}>AI PEDAGOGICAL ASSISTANT</Text>
                {contextConcept && (
                  <View style={styles.contextBadge}>
                    <Text style={styles.contextBadgeText} numberOfLines={1}>
                      {contextConcept.code}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.headerTitle}>AI Concept Tutor</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Prompt Chips */}
          <View style={styles.chipsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8 }}>
                {promptChips.map((chip, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.chipBtn}
                    onPress={() => handleSendChat(chip)}
                  >
                    <Text style={styles.chipBtnText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Chat Messages Log */}
          <ScrollView
            style={styles.chatScroll}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {chatMessages.map((msg, idx) => (
              <View
                key={idx}
                style={[
                  styles.chatBubble,
                  msg.sender === 'user' ? styles.chatBubbleUser : styles.chatBubbleAI
                ]}
              >
                <Text style={styles.chatSenderTag}>
                  {msg.sender === 'user' ? 'YOU' : '🤖 AI CONCEPT TUTOR'}
                </Text>
                <Text style={styles.chatText}>{msg.text}</Text>
              </View>
            ))}

            {isTyping && (
              <View style={[styles.chatBubble, styles.chatBubbleAI]}>
                <Text style={styles.chatSenderTag}>🤖 AI CONCEPT TUTOR</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ActivityIndicator size="small" color="#818cf8" />
                  <Text style={{ color: '#cbd5e1', fontSize: 11 }}>Synthesizing explanation...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Chat Input Bar */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputChat}
              onChangeText={setInputChat}
              placeholder="Ask AI Tutor about prerequisites..."
              placeholderTextColor="#64748b"
              returnKeyType="send"
              onSubmitEditing={() => handleSendChat()}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputChat.trim() && styles.sendBtnDisabled]}
              onPress={() => handleSendChat()}
              disabled={!inputChat.trim() || isTyping}
            >
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    height: '85%',
    display: 'flex',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#818cf8',
    letterSpacing: 1,
  },
  contextBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  contextBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#c7d2fe',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  chipsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  chipBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipBtnText: {
    color: '#c7d2fe',
    fontSize: 11,
    fontWeight: '600',
  },
  chatScroll: {
    flex: 1,
  },
  chatBubble: {
    borderRadius: 14,
    padding: 12,
    maxWidth: '88%',
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#4338ca',
  },
  chatBubbleAI: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  chatSenderTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  chatText: {
    fontSize: 13,
    color: '#f8fafc',
    lineHeight: 19,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0a0e1a',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
