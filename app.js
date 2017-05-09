/**

	Hacky little balance checker for crypocurrencies

**/

'use strict';

const fetch = require('node-fetch');
const _ = require('underscore');
const nano = require('nano')('http://localhost:5984')

var held = {
	'BTC': 1,
	'ETH': 0.4
}

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

var fin = false
var balances = {}
var balance = 0;
var balances_long = {}
var balance_long = 0;

const now = Date.now()

nano.db.create('cryptobalances', function() {
	const db = nano.use('cryptobalances')

	fetch('http://api.fixer.io/latest?base=USD&symbols=GBP')
	.then(r => r.json())
	.then(r => {
		const GBP = r.rates.GBP;
		console.log('Exchange rate: ', GBP)

		fetch('http://coincap.io/front')
		.then(r => r.json())
		.then(r => {
			var dbData = {
				exchangeRate: {
					'GBP': GBP
				},
				date: now,
				balances: [],
			}

			var list = _.map(r, function(coin) {
				

				if (held.hasOwnProperty(coin.short)) {
					let b = (coin.price * GBP) * held[coin.short]
					balances[coin.short] = b.toFixed(2)
					balance = balance + b

					let b_long = (coin.vwapData * GBP) * held[coin.short]
					balances_long[coin.short] = b_long.toFixed(2)
					balance_long = balance_long + b_long

					dbData.balances.push({
						coin: coin.short,
						price: {
							usd: coin.price,
							gbp: coin.price * GBP
						},
						vwap: {
							usd: coin.vwapData,
							gbp: coin.vwapData * GBP
						} 
					})

				}
			})

			dbData = Object.assign(dbData, {
				balance_current: balance,
				balance_vwap: balance_long
			})

			db.insert(dbData, `history_${now}`,
				function(err, body, header) {
					 if (err) {
				        console.log('[alice.insert] ', err.message);
				        return;
				      }
				      console.log('db insert successful')

				});

			console.log('============ CURRENT ===========')
			console.log(balances)
			console.log('TOTAL: GBP', balance.toFixed(2))
			console.log("")
			console.log('============ VWAP ===========')
			console.log(balances_long)
			console.log('TOTAL: GBP', balance_long.toFixed(2))
		})
	})
})