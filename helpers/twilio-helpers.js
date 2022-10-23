// const accountID = process.env.ACCOUNTID
// const authToken = process.env.AUTHTOKEN
const serviceID = process.env.SERVICEID

const client = require('twilio')(process.env.ACCOUNTID, process.env.AUTHTOKEN, serviceID)


module.exports = {
    doSms: (userData) => {
        console.log(userData.Mobile);
        return new Promise(async (resolve, reject) => {
            let res = {}
            await client.verify.services(serviceID).verifications.create({
                to: `+91${userData.Mobile}`,
                channel: 'sms'
            }).then((res) => {
                res.valid = true;
                resolve(res)
            }).catch((err) => {
                console.log(err);
            })
        })
    },
    otpVerify: (otpData, userData) => {
        return new Promise(async(resolve, reject) => {
            await client
                .verify
                .services(serviceID)
                .verificationChecks
                .create({
                    to: `+91${ userData.Mobile}`,
                    code: otpData.otp
                }).then((verifications) => {
                        resolve(verifications.valid)
                    })
    })
}

}

