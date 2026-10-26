import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { getApiBaseUrl, setApiBaseUrl, testBackendConnection } from '../services/api';

export default function ServerConfigModal({ visible, onClose, onServerChanged }) {
  const [urlInput, setUrlInput] = useState(getApiBaseUrl());
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const presets = [
    { label: '⚡ USB Cable (ADB Reverse)', url: 'http://localhost:8000/api' },
    { label: '📱 Wi-Fi LAN (Current Host)', url: 'http://10.52.246.21:8000/api' },
    { label: '🤖 Android Emulator', url: 'http://10.0.2.2:8000/api' },
  ];

  const handleTest = async (testUrl = null) => {
    const target = testUrl || urlInput;
    setTesting(true);
    setTestResult(null);
    const res = await testBackendConnection(target);
    setTestResult(res);
    setTesting(false);
  };

  const handleSave = () => {
    if (!urlInput.trim()) return;
    setApiBaseUrl(urlInput.trim());
    if (onServerChanged) onServerChanged(urlInput.trim());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          
          <View style={styles.header}>
            <View>
              <Text style={styles.tag}>CONNECTIVITY & NETWORK</Text>
              <Text style={styles.title}>Backend Server Settings</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.infoText}>
            Configure the FastAPI server endpoint. Physical Android devices on Wi-Fi connect via your machine's LAN IP, while emulators connect via 10.0.2.2.
          </Text>

          {/* Presets */}
          <View style={styles.presetsList}>
            {presets.map((p) => (
              <TouchableOpacity
                key={p.url}
                style={[styles.presetBtn, urlInput === p.url && styles.presetBtnActive]}
                onPress={() => {
                  setUrlInput(p.url);
                  handleTest(p.url);
                }}
              >
                <Text style={styles.presetLabel}>{p.label}</Text>
                <Text style={styles.presetUrl}>{p.url}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom URL Input */}
          <Text style={styles.label}>Custom Server URL</Text>
          <TextInput
            style={styles.input}
            value={urlInput}
            onChangeText={setUrlInput}
            placeholder="http://192.168.1.100:8000/api"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
          />

          {/* Test Ping Status */}
          {testResult && (
            <View style={[
              styles.testResultBox,
              testResult.success ? styles.testSuccess : styles.testError
            ]}>
              <Text style={styles.testResultText}>
                {testResult.success
                  ? `🟢 Server Online! (${testResult.latency}ms) • ${testResult.data?.status || 'Operational'}`
                  : `🔴 Connection Failed: ${testResult.error}`}
              </Text>
              {testResult.success && testResult.data?.firebase_integration?.connected && (
                <Text style={styles.testSubText}>
                  Firebase Realtime Database: Connected live
                </Text>
              )}
            </View>
          )}

          {/* Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={() => handleTest()}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator size="small" color="#818cf8" />
              ) : (
                <Text style={styles.testBtnText}>⚡ Ping Server</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Apply & Save</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 20,
    width: '100%',
    maxWidth: 420,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#818cf8',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
    marginBottom: 14,
  },
  presetsList: {
    gap: 8,
    marginBottom: 14,
  },
  presetBtn: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetBtnActive: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  presetUrl: {
    fontSize: 10,
    color: '#818cf8',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  testResultBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  testSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  testError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  testResultText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  testSubText: {
    fontSize: 10,
    color: '#34d399',
    marginTop: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  testBtn: {
    flex: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBtnText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
