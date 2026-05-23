import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from './ThemeContext';

export interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertContextData {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
}

const AlertContext = createContext<AlertContextData>({} as AlertContextData);

export function AlertProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState<string | undefined>('');
  const [buttons, setButtons] = useState<AlertButton[]>([]);

  const showAlert = useCallback((t: string, m?: string, b?: AlertButton[]) => {
    setTitle(t);
    setMessage(m);
    
    // Default button if none provided
    if (!b || b.length === 0) {
      setButtons([{ text: 'OK' }]);
    } else {
      setButtons(b);
    }
    
    setVisible(true);
  }, []);

  const closeAlert = () => {
    setVisible(false);
  };

  const handleButtonPress = (btn: AlertButton) => {
    closeAlert();
    if (btn.onPress) {
      // Pequeno timeout para permitir a animação de fechamento do modal antes de executar a ação
      setTimeout(() => {
        btn.onPress!();
      }, 100);
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={closeAlert}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeAlert}>
          <TouchableWithoutFeedback>
            <View style={[styles.alertBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
              
              {message ? (
                <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
              ) : null}
              
              <View style={styles.buttonContainer}>
                {buttons.map((btn, index) => {
                  const isDestructive = btn.style === 'destructive';
                  const isCancel = btn.style === 'cancel';
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        index > 0 && { borderLeftWidth: 1, borderLeftColor: theme.border },
                      ]}
                      onPress={() => handleButtonPress(btn)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          isDestructive && { color: theme.danger },
                          isCancel && { color: theme.textSecondary, fontWeight: 'normal' },
                          !isDestructive && !isCancel && { color: theme.primary }
                        ]}
                      >
                        {btn.text || 'OK'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useCustomAlert() {
  return useContext(AlertContext);
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertBox: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 16,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)', // será sobrescrito pelo theming individual mas serve de fallback
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
