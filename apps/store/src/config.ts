/** Централізовані змінні оточення для API-маршрутів. */
const novaApiUrl =
	process.env.NOVA_POSHTA_API_URL?.trim() ||
	'https://api.novaposhta.ua/v2.0/json/';

export default {
	env: {
		novaPoshta: {
			apiKey:
				process.env.NOVA_POSHTA_API_KEY ?? '5967ebced26b6b60bc435c08b62c6904',
			apiEndpoint: novaApiUrl,
		},
		mail: {
			user: process.env.SMTP_USER ?? '',
			appPassword:
				process.env.SMTP_APP_PASSWORD?.trim() ||
				process.env.SMTP_PASSWORD?.trim() ||
				'',
		},
	},
} as const;
