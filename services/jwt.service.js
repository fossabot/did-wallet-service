"use strict";


/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: "jwt",

	/**
	 * Settings
	 */
	settings: {
		resolver:{
			rpcUrl:"https://integration.corrently.io/",
			name: "mainnet",
			chainId: "6226",
			registry:"0xda77BEeb5002e10be2F5B63E81Ce8cA8286D4335"
		}
	},

	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Input DID-JWT
		 *  - Stage 1 - Resolve DID
		 *  - Stage 2 - Parse DID (what todo with it)
		 *  - Stage 3 - Provide Response
		 * @params: did:"string"
		 * @returns JWT DID
		 */
		input: {
			rest: {
				method: "POST",
				path: "/input"
			},
			params: {
				did:"string"
			},
			async handler(ctx) {
				let response = {type:'CONTRL'};

				// Stage 1 - Resolve DID
				const JWTResolver = require("../lib/JWTResolver.js");
				const resolver = new JWTResolver(this.settings.resolver);
				let did = { issuer: 'internal:0x0',payload:{} }
				try {
					did = await resolver.toDid(ctx.params.did);
				} catch(e) {
					response.type = 'APERAK';
					response.error = e.message;
				}
				const maskedidentity = await ctx.call("maskedidentity.get",{identity:did.issuer});
				// Stage 2 - Parse DID (what todo with it)
				if((typeof did.payload.type !== 'undefined') && (did.payload.type !== null)) {
					if(did.payload.type == 'CONTRL') {
						if(typeof did.payload.addSchema !== 'undefined') {
							response.schema = await ctx.call("maskedidentity.addSchema",{identity:did.issuer,schema:did.payload.addSchema});
						}
						if(typeof did.payload.addWebhook !== 'undefined') {
							response.webhook = await ctx.call("maskedidentity.addWebhook",{
								identity:did.issuer,
								url:did.payload.addWebhook.url,
								schema:did.payload.addWebhook.schema
							});
						}
						if(typeof did.payload.listSchemas !== 'undefined') {
							response.schemas = {};
							for (const [key, value] of Object.entries(maskedidentity.storage.schemas)) {
							  response.schemas[key] = value;
							}
						}
						if(typeof did.payload.listWebhooks !== 'undefined') {
							response.webhooks = {};
							for (const [key, value] of Object.entries(maskedidentity.storage.webhooks)) {
								response.webhooks[key] = value;
							}
						}
						if(typeof did.payload.listPresentations !== 'undefined') {
							response.presentations = {};
							for (const [key, value] of Object.entries(maskedidentity.storage.presentations)) {
								response.presentations[key] = value;
							}
						}
						if(typeof did.payload.sign !== 'undefined') {
							response = did.payload.sign;
						}
						if(typeof did.payload.ping !== 'undefined') {
							response.ping = did.payload.ping;
							response.pong = new Date().getTime();
						}
					}
				} else {
					if(typeof ctx.params.wallet !== 'undefined') ctx.params.to = ctx.params.wallet;
					if(typeof ctx.params.account !== 'undefined') ctx.params.to = ctx.params.account;
					if(typeof ctx.params.identity !== 'undefined') ctx.params.to = ctx.params.identity;

					if((typeof ctx.params.to !== 'undefined')&&(typeof ctx.params.schema !== 'undefined')) {
						let presentation  = await ctx.call("maskedidentity.addPresentation",{identity:ctx.params.to,presentation:did,schema:ctx.params.schema});
						response.presentation = presentation.hash;
						if(typeof presentation.error !== 'undefined') {
							response.type = "APERAK";
							response.error = presentation.error;
						}
					} else {
						response.type = "APERAK";
						response.error = "Presentation without Schema";
					}
				}
				// Stage 3 - Provide Responseas Did
				const JWTBuilder = require("../lib/JWTBuilder.js");
				const builder = new JWTBuilder({identity:maskedidentity});
				return builder.toJWT(response);
			}
		},
		/**
		 * Say a 'Hello' action.
		 *
		 * @returns
		 */
		ping: {
			rest: {
				method: "GET",
				path: "/ping"
			},
			async handler() {
				return "Pong JWT";
			}
		}
	},

	/**
	 * Events
	 */
	events: {

	},

	/**
	 * Methods
	 */
	methods: {

	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {

	},

	/**
	 * Service started lifecycle event handler
	 */
	async started() {

	},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {

	}
};
