import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MedicalExam } from '@/types/exam-flow-types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ThemedText } from './themed-text';
import { Droplet, Activity, Heart, FlaskConical, FileText } from 'lucide-react-native';
import { useTheme, ThemeColors } from '@/context/ThemeContext';

interface ExamCardProps {
  exam: MedicalExam;
}

const examTypeIcons: Record<string, React.ElementType> = {
  'blood-test': Droplet,
  'imaging': Activity,
  'cardiology': Heart,
  'urine-test': FlaskConical,
  'report': FileText,
};

const examTypeLabels = {
  'blood-test': 'Exame de Sangue',
  'imaging': 'Imagem',
  'cardiology': 'Cardiologia',
  'urine-test': 'Exame de Urina',
  'report': 'Relatório',
};

const getStatusColors = (isDarkMode: boolean) => ({
  completed: isDarkMode ? '#064e3b' : '#dcfce7',
  pending: isDarkMode ? '#78350f' : '#fef3c7',
  processing: isDarkMode ? '#1e3a8a' : '#dbeafe',
});

const getStatusTextColors = (isDarkMode: boolean) => ({
  completed: isDarkMode ? '#34d399' : '#047857',
  pending: isDarkMode ? '#fbbf24' : '#d97706',
  processing: isDarkMode ? '#60a5fa' : '#2563eb',
});

const statusLabels = {
  completed: 'Concluído',
  pending: 'Pendente',
  processing: 'Processando',
};

export function ExamCard({ exam }: ExamCardProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const router = useRouter();
  const statusColors = getStatusColors(isDarkMode);
  const statusTextColors = getStatusTextColors(isDarkMode);

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
            {(() => {
              const IconComponent = examTypeIcons[exam.type] || FileText;
              return <IconComponent size={24} color={theme.primary} />;
            })()}
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

const getStyles = (theme: ThemeColors) => StyleSheet.create({
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
    backgroundColor: theme.card === '#ffffff' ? '#f0fdfa' : theme.border,
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
    color: theme.text,
    flex: 1,
  },
  statusBadge: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  description: {
    fontSize: 12,
    color: theme.textSecondary,
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
    color: theme.text,
  },
  date: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  facility: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 4,
  },
});