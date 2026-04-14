import { View, Text, Button } from 'react-native';
import { createAuthorizer } from '@/security/authorizer';
import { secureRequest } from '@/security/secureRequest';

export default function TestSecurity() {
	const testFlow = async () => {
		try {
		console.log('🔐 Criando autorizador...');
		const auth = await createAuthorizer();
		console.log('AUTH:', JSON.stringify(auth, null, 2));

		console.log('✍️ Assinando request...');
		const res = await secureRequest('https://httpbin.org/post', {
			method: 'POST',
		});

		console.log('RESPONSE:', JSON.stringify(res, null, 2));

		} catch (err) {
			console.error(err);
		}
	};

	return (
		<View style={{ padding: 20 }}>
		<Text>Teste de Segurança</Text>
		<Button title="Testar fluxo" onPress={testFlow} />
		</View>
	);
}