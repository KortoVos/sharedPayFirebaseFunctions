"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorldd = functions.https.onRequest((request, response) => {
//   response.send("Hello from Firebase!");
// });
// exports.accountchange = functions.firestore.document('/wallets/{walletid}/wallet_records/{recordid}').onCreate((snap, context) => {
//   const newValue = snap.data();
//   const amount:number = newValue.amount;
//   //console.log("amount: ",amount)
//   return admin.firestore().collection('/wallets/'+context.params.walletid+'/wallet_members').get().then(querySnapshot => {
//     const size:number = querySnapshot.size;
//     const promises = [];
//     querySnapshot.forEach(function (memb) {
//       //console.log(memb.id, " => ", memb.data());
//       const oldMoney:number = memb.data().money;
//       let newMoney:number = newValue.payer.includes(memb.id)? +oldMoney + +amount : oldMoney;
//       newMoney -= amount / size;
//       const p = admin.firestore().doc('/wallets/'+context.params.walletid+'/wallet_members/'+memb.id).update({ money:newMoney});
//       promises.push(p);
//     });
//     return Promise.all(promises);
//   });
// });
// When a new Rocord is creating, the money amount of each user  that has payed or needs to pay something for this record will be updated
exports.recordOnCreate = functions.firestore.document('/wallets/{walletid}/wallet_records/{recordid}').onCreate((snap, context) => {
    const newValue = snap.data();
    let memberMoneyAmountChange = [];
    const promises = [];
    newValue.buyer.map(b => {
        memberMoneyAmountChange[b.memberId] = b.amount;
        //console.log("memberMoneyAmountChange buy "+b.memberId,memberMoneyAmountChange[b.memberId] )
    });
    newValue.payer.map(p => {
        if (typeof memberMoneyAmountChange[p.memberId] === 'undefined') {
            memberMoneyAmountChange[p.memberId] = -p.amount;
        }
        else {
            memberMoneyAmountChange[p.memberId] -= p.amount;
        }
        //console.log("memberMoneyAmountChange pay "+p.memberId,memberMoneyAmountChange[p.memberId] )
    });
    for (let el in memberMoneyAmountChange) {
        //console.log(el + "  ", memberMoneyAmountChange[el]);
        const pr = admin.firestore().doc('/wallets/' + context.params.walletid + '/wallet_members/' + el).get().then(documentSnapshot => {
            //console.log(documentSnapshot.data().name+" " + documentSnapshot.id + " oldMoney: ",documentSnapshot.data().money)
            let newMoney = documentSnapshot.data().money + memberMoneyAmountChange[documentSnapshot.id];
            //console.log(documentSnapshot.data().name+" " +  documentSnapshot.id +" newMoney: ",newMoney)
            return admin.firestore().doc('/wallets/' + context.params.walletid + '/wallet_members/' + documentSnapshot.id).update({ money: newMoney });
        });
        promises.push(pr);
    }
    return Promise.all(promises);
});
// When a Record updates the old record will be stored in a subcollection of the record and the user money will update
exports.recordOnUpdate = functions.firestore.document('/wallets/{walletid}/wallet_records/{recordid}').onUpdate((change, context) => {
    const promises = [];
    const newValue = change.after.data();
    const previousValue = change.before.data();
    const histDocID = new Date().getTime().toString();
    const historyPromise = admin.firestore().doc('/wallets/' + context.params.walletid + '/wallet_records/' + context.params.recordid + '/history/' + histDocID).set(previousValue);
    promises.push(historyPromise);
    let memberMoneyAmountChange = [];
    previousValue.buyer.map(b => {
        memberMoneyAmountChange[b.memberId] = -b.amount;
        console.log("memberMoneyAmountChange pre " + b.memberId, memberMoneyAmountChange[b.memberId]);
    });
    newValue.buyer.map(b => {
        if (typeof memberMoneyAmountChange[b.memberId] === 'undefined') {
            memberMoneyAmountChange[b.memberId] = b.amount;
        }
        else {
            memberMoneyAmountChange[b.memberId] += b.amount;
        }
        console.log("memberMoneyAmountChange new " + b.memberId, memberMoneyAmountChange[b.memberId]);
    });
    previousValue.payer.map(p1 => {
        if (typeof memberMoneyAmountChange[p1.memberId] === 'undefined') {
            memberMoneyAmountChange[p1.memberId] = +p1.amount;
        }
        else {
            memberMoneyAmountChange[p1.memberId] += p1.amount;
        }
    });
    newValue.payer.map(p => {
        if (typeof memberMoneyAmountChange[p.memberId] === 'undefined') {
            memberMoneyAmountChange[p.memberId] = -p.amount;
        }
        else {
            memberMoneyAmountChange[p.memberId] -= p.amount;
        }
        //console.log("memberMoneyAmountChange pay "+p.memberId,memberMoneyAmountChange[p.memberId] )
    });
    for (let el in memberMoneyAmountChange) {
        console.log(el + "  ", memberMoneyAmountChange[el]);
        const pr = admin.firestore().doc('/wallets/' + context.params.walletid + '/wallet_members/' + el).get().then(documentSnapshot => {
            console.log(documentSnapshot.data().name + " " + documentSnapshot.id + " oldMoney: ", documentSnapshot.data().money);
            let newMoney = documentSnapshot.data().money + memberMoneyAmountChange[documentSnapshot.id];
            console.log(documentSnapshot.data().name + " " + documentSnapshot.id + " newMoney: ", newMoney);
            return admin.firestore().doc('/wallets/' + context.params.walletid + '/wallet_members/' + documentSnapshot.id).update({ money: newMoney });
        });
        promises.push(pr);
    }
    return Promise.all(promises);
});
//# sourceMappingURL=index.js.map