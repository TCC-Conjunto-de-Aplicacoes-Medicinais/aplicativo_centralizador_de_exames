import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { X, FileText } from 'lucide-react-native';
import { useTheme, ThemeColors } from '@/context/ThemeContext';

interface LegalTermsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LegalTermsModal({ visible, onClose }: LegalTermsModalProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerTitleRow}>
                <FileText color={theme.primary} size={20} style={styles.headerIcon} />
                <Text style={styles.modalTitle}>Termos & Privacidade</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeIconButton}>
                <X color={theme.text} size={24} />
              </TouchableOpacity>
            </View>

            {/* Document Content */}
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.docMainTitle}>TERMOS DE USO E POLÍTICA DE PRIVACIDADE</Text>
              <Text style={styles.docSubtitle}>POHINC – Plataforma Open Health para Interoperabilidade Clínica</Text>

              <View style={styles.noticeCard}>
                <Text style={styles.noticeTitle}>AVISO LEGAL CRÍTICO</Text>
                <Text style={styles.noticeText}>
                  Este documento constitui um contrato vinculante entre o usuário (paciente) e a plataforma POHINC. 
                  A utilização do aplicativo mobile e a gestão de consentimentos associados pressupõem a aceitação 
                  integral de todas as cláusulas e condições dispostas a seguir.
                </Text>
              </View>

              <Text style={styles.paragraph}>
                Estes Termos de Uso e Política de Privacidade regulam o acesso e a utilização do aplicativo móvel de 
                titularidade da POHINC, concebido como um ecossistema descentralizado de <Text style={styles.italic}>Open Health</Text> focado 
                na unificação, portabilidade e custódia segura de prontuários médicos e exames de eletrocardiograma (ECG), 
                em estrito alinhamento com os parâmetros regulatórios de saúde e infraestrutura digital vigentes no país.
              </Text>

              {/* Section 1 */}
              <Text style={styles.sectionHeader}>1. Definições e Escopo Operacional</Text>
              <Text style={styles.paragraph}>
                Para fins de interpretação deste instrumento, consideram-se as seguintes definições técnicas:
              </Text>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>POHINC:</Text> Plataforma arquitetada sob o modelo SaaS multi-tenant que 
                  realiza o provisionamento automatizado de sistemas clínicos isolados e integra uma camada unificada 
                  de interoperabilidade biomédica.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Interoperabilidade baseada no HL7 FHIR:</Text> Padrão internacional de 
                  representação e transferência de dados em saúde adotado nativamente para garantir que as informações 
                  clínicas transitem de forma idêntica e inteligível entre diferentes entidades.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Soberania do Paciente:</Text> O direito intransferível do usuário de gerir, 
                  auditar, conceder e revogar o acesso a qualquer dado de sua titularidade armazenado no ecossistema.
                </Text>
              </View>

              {/* Section 2 */}
              <Text style={styles.sectionHeader}>2. Direitos de Propriedade Intelectual e Segurança da Informação</Text>
              <Text style={styles.paragraph}>
                Todo o código-fonte, marcas, interfaces, motores de geração e algoritmos preditivos vinculados à POHINC são de 
                propriedade exclusiva de seus idealizadores. É expressamente vedada qualquer tentativa de engenharia reversa, 
                descompilação ou violação dos mecanismos de autenticação.
              </Text>
              <Text style={styles.paragraph}>
                A segurança lógica do tráfego de dados é garantida através de protocolos criptográficos avançados, segregados 
                em duas camadas de persistência:
              </Text>
              <View style={styles.numberedItem}>
                <Text style={styles.number}>1.</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Camada Local Unitenant (MariaDB):</Text> Os dados administrativos e o fluxo 
                  transacional interno das clínicas permanecem isolados em instâncias relacionais exclusivas de cada 
                  instituição jurídica, mitigando riscos de vazamento cruzado.
                </Text>
              </View>
              <View style={styles.numberedItem}>
                <Text style={styles.number}>2.</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Camada Analítica Global (Apache Cassandra):</Text> As séries temporais e os 
                  vetores brutos extraídos dos eletrocardiogramas são consolidados em uma infraestrutura distribuída 
                  NoSQL de alta disponibilidade, acessível unicamente mediante requisições validadas pelo barramento central.
                </Text>
              </View>

              {/* Section 3 */}
              <Text style={styles.sectionHeader}>3. Tratamento de Dados Pessoais Sensíveis e Conformidade com a LGPD</Text>
              <Text style={styles.paragraph}>
                Em total observância à Lei Geral de Proteção de Dados (Lei nº 13.709/18), em especial aos Artigos 5º (inciso II) 
                e 11, que versam sobre dados sensíveis de saúde, e às normativas do Conselho Federal de Medicina (CFM):
              </Text>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Consentimento Inequívoco:</Text> A POHINC atua sob o dogma do 
                  <Text style={styles.italic}> Privacy by Design</Text>. Nenhum histórico clínico será transferido, compartilhado ou 
                  disponibilizado a terceiros sem que o usuário emita uma autorização explícita e digital por meio do 
                  aplicativo de celular.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Rastreabilidade e Log de Auditoria:</Text> Toda e qualquer concessão ou revogação de 
                  acesso gera um registro imutável no submódulo de logs do aplicativo, contendo data, horário, IP e identificação 
                  do nó solicitante, permitindo auditorias técnicas completas.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Anonimização e Apresentação:</Text> Dados biométricos e de identificação pessoal sofrem 
                  severo mascaramento na camada de apresentação visual do Next.js e React Native, prevenindo a exposição 
                  involuntária de informações a observadores casuais.
                </Text>
              </View>

              {/* Section 4 */}
              <Text style={styles.sectionHeader}>4. Arquitetura de Autenticação Robusta (DPoP e Keycloak)</Text>
              <Text style={styles.paragraph}>
                A validação da identidade do usuário no dispositivo móvel afasta-se de mecanismos puramente estáticos. 
                A infraestrutura de segurança impõe:
              </Text>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Isolamento de Credenciais (Keycloak):</Text> A base de autenticação, gerenciamento 
                  de sessões, geração de chaves JWT e verificação de duplo fator (MFA/Authenticator) ocorrem em um servidor 
                  dedicado Keycloak, sem contato direto com as APIs operacionais do sistema clínico.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Demonstrating Proof-of-Possession (DPoP):</Text> Mecanismo de segurança de borda que 
                  atrela cada token emitido a uma chave privada assimétrica gerada dinamicamente dentro do chip físico de segurança 
                  do celular (Android Keystore ou iOS Keychain). Este processo garante que a transação só possui validade jurídica 
                  se originada do dispositivo físico legítimo do paciente, impedindo ataques de interceptação (Replay Attacks).
                </Text>
              </View>

              {/* Section 5 */}
              <Text style={styles.sectionHeader}>5. Responsabilidade e Isenção Clínico-Diagnóstica da IA</Text>
              <Text style={styles.paragraph}>
                O usuário declara ciência inequívoca de que as ferramentas de Inteligência Artificial acopladas à segunda etapa do 
                projeto (motores baseados em Redes Neurais Convolucionais unidimensionais, modelos de linguagem 
                <Text style={styles.bold}> MedGemma</Text> / <Text style={styles.bold}>Gemini</Text> e arquiteturas 
                <Text style={styles.bold}> RAG</Text>) operam única e exclusivamente como 
                <Text style={styles.bold}> sistemas de suporte à decisão clínica (segunda opinião)</Text>.
              </Text>
              <Text style={styles.paragraph}>
                A triagem e os relatórios automatizados de IA servem para apontar possíveis anomalias morfológicas no ECG ou 
                extrair correlações contextuais em prontuários textuais, não configurando laudo médico autônomo. A responsabilidade 
                técnica, civil e penal pelo diagnóstico definitivo e pela conduta terapêutica permanece integralmente com o 
                profissional de medicina assistente devidamente registrado no Conselho Regional de Medicina (CRM).
              </Text>

              {/* Section 6 */}
              <Text style={styles.sectionHeader}>6. Resolução de Conflitos e Foro</Text>
              <Text style={styles.paragraph}>
                Este termo é regido, interpretado e executado de acordo com as leis da República Federativa do Brasil. Fica eleito 
                o foro da comarca de São Paulo, SP, com expressa renúncia a qualquer outro, por mais privilegiado que seja, para 
                dirimir quaisquer controvérsias oriundas do uso da plataforma POHINC.
              </Text>

              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>
                  Versão Documental Revisada para Homologação Acadêmica / Engenharia de Software.
                </Text>
                <Text style={styles.footerText}>
                  Última atualização: Maio de 2026. - POHINC Compliance Department.
                </Text>
              </View>
            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
                <Text style={styles.primaryButtonText}>Entendi e Aceito</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const getStyles = (theme: ThemeColors, isDarkMode: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    safeArea: {
      flex: 1,
    },
    modalContent: {
      flex: 1,
      backgroundColor: theme.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      marginTop: 40,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIcon: {
      marginRight: 8,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    closeIconButton: {
      padding: 4,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    docMainTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    docSubtitle: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    noticeCard: {
      backgroundColor: isDarkMode ? 'rgba(13, 148, 136, 0.1)' : '#f0fdfa',
      borderColor: isDarkMode ? 'rgba(13, 148, 136, 0.3)' : '#ccfbf1',
      borderWidth: 1,
      borderRadius: 8,
      padding: 14,
      marginBottom: 20,
    },
    noticeTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#0d9488',
      marginBottom: 6,
      letterSpacing: 0.5,
    },
    noticeText: {
      fontSize: 13,
      color: isDarkMode ? '#2dd4bf' : '#0f766e',
      lineHeight: 18,
      fontWeight: '500',
    },
    paragraph: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 22,
      marginBottom: 16,
    },
    sectionHeader: {
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.text,
      marginTop: 20,
      marginBottom: 10,
      borderLeftWidth: 3,
      borderLeftColor: theme.primary,
      paddingLeft: 8,
    },
    bulletItem: {
      flexDirection: 'row',
      marginBottom: 10,
      paddingLeft: 6,
    },
    bulletPoint: {
      fontSize: 14,
      color: theme.primary,
      width: 14,
      fontWeight: 'bold',
    },
    bulletText: {
      flex: 1,
      fontSize: 13.5,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    numberedItem: {
      flexDirection: 'row',
      marginBottom: 12,
      paddingLeft: 6,
    },
    number: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.primary,
      width: 20,
    },
    bold: {
      fontWeight: 'bold',
      color: theme.text,
    },
    italic: {
      fontStyle: 'italic',
    },
    footerContainer: {
      marginTop: 30,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      gap: 6,
    },
    footerText: {
      fontSize: 11,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 16,
    },
    modalFooter: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
    },
    primaryButton: {
      backgroundColor: theme.primary,
      height: 48,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
