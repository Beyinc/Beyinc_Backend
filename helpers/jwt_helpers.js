const JWT = require('jsonwebtoken')
module.exports={
    signAccessToken: (payload, userId) =>{
        return new Promise((resolve, reject)=>{
            // const payload={};
            const secretKey = process.env.ACCESS_TOKEN_SECRET;
            const options= {
                expiresIn: '1d',
                audience: userId,
            }
            JWT.sign(payload, secretKey, options, (err, token)=>{
                if(err){
                    return reject(err)
                }
                return resolve(token)
            })
        })
    },
    signEmailOTpToken: (payload) =>{
        return new Promise((resolve, reject)=>{
            // const payload={};
            const secretKey = process.env.ACCESS_TOKEN_SECRET;
            const options= {
                expiresIn: '120s',
            }
            JWT.sign(payload, secretKey, options, (err, token)=>{
                if(err){
                    return reject(err)
                }
                return resolve(token)
            })
        })
    },

    verifyEmailOtpToken: (token)=>{
        return new Promise((resolve, reject)=>{
            JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload)=>{
                if(err){
                   return reject(err)
                }
                const otp = payload.otp;
                const email = payload.email;
                resolve({otp: otp, email: email})
            })
        })
    },

    signRefreshToken: (payload, userId) =>{
        return new Promise((resolve, reject)=>{
            // const payload={};
            const secretKey = process.env.REFRESH_TOKEN_SECRET;
            const options= {
                expiresIn: '1y',
                audience: userId,
            }
            JWT.sign(payload, secretKey, options, (err, token)=>{
                if(err){
                    return reject(err)
                }
                return resolve(token)
            })
        })
    },


    verifyAccessToken: (req, res, next)=>{
        if(!req.headers['authorization']){
            return res.status(401).json({ message: 'UnAuthorized'})
        }
        const authHeader = req.headers['authorization']
        const bearerToken = authHeader.split(' ')
        const token = bearerToken[1]
        // console.log(JWT.sign(token, process.env.ACCESS_TOKEN_SECRET))
        JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload)=>{
            if(err){
                return res.status(401).json({ message: 'Your session expired please login again'})
            }
            req.payload = payload
            next()
        })
    },

    verifyAPiAccessToken: (token) => {
        return new Promise((resolve, reject) => {
            JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
                if (err) {
                    return reject(err.message)
                }
                const userId = payload.aud;
                const email = payload.email;
                resolve({ user_id: userId, email: email })
            }) 
        })
    },
    // checking
    verifyRefreshToken: (token)=>{
        return new Promise((resolve, reject)=>{
            JWT.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, payload)=>{
                if(err){
                    return reject(err.message)
                }
                const userId = payload.aud;
                const email = payload.email;
                resolve({user_id: userId, email: email})
            })
        })
    },

    optionallyVerifyAccessToken: (req, res, next)=>{
        if (req.headers["authorization"]) {
            const authHeader = req.headers["authorization"];
            const bearerToken = authHeader.split(" ");
            const token = bearerToken[1];
            console.log({authHeader, bearerToken, token})

            if(token !== undefined){
                JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
                    if (err) {
                        return res
                            .status(401)
                            .json({
                                message: "Your session expired please login again",
                            });
                    }
                    req.payload = payload;
                });
            }
        }
        next();
    },
}