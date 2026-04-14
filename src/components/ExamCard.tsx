import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MedicalExam } from '@/types/exam-flow-types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { SymbolView } from 'expo-symbols';

interface ExamCardProps {
  exam: MedicalExam;
}

const examTypeIcons = {
  'blood-test': 'drop.fill',
  'imaging': 'waveform.path.ecg',
  'cardiology': 'heart.fill',
  'urine-test': 'drop.fill',
  'report': 'doc.text.fill',
};

const examTypeLabels = {
  'blood-test': 'Exame de Sangue',
  'imaging': 'Imagem',
  'cardiology': 'Cardiologia',
  'urine-test': 'Exame de Urina',
  'report': 'Relatório',
};

const statusColors = {
  completed: '#dcfce7', // emerald-100
  pending: '#fef3c7', // amber-100
  processing: '#dbeafe', // blue-100
};

const statusTextColors = {
  completed: '#047857', // emerald-700
  pending: '#d97706', // amber-700
  processing: '#2563eb', // blue-700
};

const statusLabels = {
  completed: 'Concluído',
  pending: 'Pendente',
  processing: 'Processando',
};

export function ExamCard({ exam }: ExamCardProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handlePress = () => {
    router.push(`/exam-flow/exam/${exam.id}`);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <SymbolView
              name={examTypeIcons[exam.type] || 'doc.fill'}
              size={24}
              tintColor="#0f766e" // teal-600
            />
          </View>

          {/* Content */}
          <View style={styles.textContainer}>
            <View style={styles.header}>
              <ThemedText style={styles.title} numberOfLines={2}>
                {exam.name}
              </ThemedText>
              <Badge
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColors[exam.status] },
                ]}
                textStyle={{ color: statusTextColors[exam.status] }}
              >
                {statusLabels[exam.status]}
              </Badge>
            </View>

            {exam.description && (
              <ThemedText style={styles.description} numberOfLines={2}>
                {exam.description}
              </ThemedText>
            )}

            <View style={styles.footer}>
              <ThemedText style={styles.type}>
                {examTypeLabels[exam.type]}
              </ThemedText>
              <ThemedText style={styles.date}>
                {formatDate(exam.date)}
              </ThemedText>
            </View>

            {exam.facility && (
              <ThemedText style={styles.facility} numberOfLines={1}>
                {exam.facility}
              </ThemedText>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdfa', // teal-50
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a', // slate-900
    flex: 1,
  },
  statusBadge: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  description: {
    fontSize: 12,
    color: '#64748b', // slate-500
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  type: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569', // slate-600
  },
  date: {
    fontSize: 12,
    color: '#64748b', // slate-500
  },
  facility: {
    fontSize: 11,
    color: '#94a3b8', // slate-400
    marginTop: 4,
  },
});