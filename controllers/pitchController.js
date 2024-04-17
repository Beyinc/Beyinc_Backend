const send_Notification_mail = require("../helpers/EmailSending")
const Notification = require("../models/NotificationModel")
const Pitch = require("../models/PitchModel")
const User = require("../models/UserModel")
const cloudinary = require("../helpers/UploadImage");

exports.createPitch = async (req, res, next) => {
    try {
        const { form, email, teamMembers, role, tags } = req.body;
        const { title, changeStatus, pitchId, pitch, banner, logo, financials, pitchRequiredStatus } = form;
        let pitchDoc = ''
        if (pitch?.public_id == undefined) {
            pitchDoc = await cloudinary.uploader.upload(pitch, {
                folder: `${email}/pitch`
            })
        } else {
            pitchDoc = pitch
        }


        // uploading Banner image
        let bannerDoc = ''
        if (banner?.public_id == undefined) {
            bannerDoc = await cloudinary.uploader.upload(banner, {
                folder: `${email}/pitch`
            })
        } else {
            bannerDoc = banner
        }


        // uploading logo image
        let logoDoc = ''
        if (logo?.public_id == undefined) {
            logoDoc = await cloudinary.uploader.upload(logo, {
                folder: `${email}/pitch`
            })
        } else {
            logoDoc = logo
        }

        // uploading financials image
        let financialsDoc = ''
        if (financials?.public_id == undefined) {
            financialsDoc = await cloudinary.uploader.upload(financials, {
                folder: `${email}/pitch`
            })
        } else {
            financialsDoc = financials
        }

        const teams = []
        for (let i = 0; i < teamMembers.length; i++) {
            let singMemberDoc = ''
            if (teamMembers[i]?.memberPic.public_id == undefined) {
                singMemberDoc = await cloudinary.uploader.upload(teamMembers[i]?.memberPic, {
                    folder: `${email}/pitch`
                })
            } else {
                singMemberDoc = teamMembers[i]?.memberPic
            }

            teams.push({ memberPic: { secure_url: singMemberDoc?.secure_url, public_id: singMemberDoc?.public_id }, name: teamMembers[i]?.name, position: teamMembers[i]?.position, socialLink: teamMembers[i]?.socialLink, bio: teamMembers[i]?.bio })

        }

        // creating new pitch
        if (form._id !== undefined) {
            delete form._id
        }
        const userExist = await User.findOne({ email: email })
        console.log(userExist)
        const colleges = []
        for (let i = 0; i < userExist.educationDetails.length; i++) {
            colleges.push(userExist.educationDetails[i].college)
        }
        if (pitchId == '') {
            await Pitch.create({ ...form, associatedTo: [], userInfo: userExist._id, comments: [], review: [], teamMembers: [...teams], pitchRequiredStatus: pitchRequiredStatus, email: email, tags: tags, title: title, status: 'approved', pitch: { secure_url: pitchDoc?.secure_url, public_id: pitchDoc?.public_id }, banner: { secure_url: bannerDoc?.secure_url, public_id: bannerDoc?.public_id }, logo: { secure_url: logoDoc?.secure_url, public_id: logoDoc?.public_id }, financials: { secure_url: financialsDoc?.secure_url, public_id: financialsDoc?.public_id } })
            return res.status(200).send('Pitch created');
        } else {
            const singlepitch = await Pitch.findOne({ _id: pitchId })
            // if (singlepitch.associatedTo.length > 0) {
            //     return res.status(400).json('Pitch is Associated with mentors')
            // }
            await Pitch.updateOne({ _id: pitchId }, { $set: { ...form, teamMembers: [...teams], pitchRequiredStatus: pitchRequiredStatus, email: email, tags: tags, title: title, status: 'approved', pitch: { secure_url: pitchDoc?.secure_url, public_id: pitchDoc?.public_id }, banner: { secure_url: bannerDoc?.secure_url, public_id: bannerDoc?.public_id }, logo: { secure_url: logoDoc?.secure_url, public_id: logoDoc?.public_id }, financials: { secure_url: financialsDoc?.secure_url, public_id: financialsDoc?.public_id } }})
            return res.status(200).send('Pitch Updated');
        }

    } catch (err) {
        console.log(err)
        return res.status(400).send(err)
    }
}

exports.fetchPendingPitch = async (req, res, next) => {
    try {
        const pendingPitches = await Pitch.find({ status: 'pending' })
        return res.status(200).json(pendingPitches)
    } catch (err) {
        return res.status(400).json(err)
    }
}

exports.deletePitch = async (req, res, next) => {
    try {
        const pitch = await Pitch.findOne({ _id: req.body.pitchId })
        if (pitch.associatedTo.length > 0) {
            return res.status(400).json('Pitch is Associated with mentors')  
        }
        await Pitch.deleteOne({ _id: req.body.pitchId })
        return res.status(200).json('Pitch is deleted')
    } catch (err) {
        return res.status(400).json('Error occured')
    }
}

exports.fetchSinglePitch = async (req, res, next) => {
    try {
        const pendingPitches = await Pitch.findOne({ _id: req.body.pitchId }).populate({ path: 'userInfo', select: [ 'userName', 'image', 'role'] }).populate({ path: 'associatedTo', select: [ 'userName', 'image', 'role'] });
        return res.status(200).json(pendingPitches)
    } catch (err) {
        return res.status(400).json(err)
    }
}


exports.updateSinglePitch = async (req, res, next) => {
    try {
        const pitch = await Pitch.findOne({ _id: req.body.pitchId }).populate({ path: 'userInfo', select: [ 'userName', 'image', 'role'] });
        if (pitch) {
            await Pitch.updateOne({ _id: req.body.pitchId }, { $set: { status: 'approved', pitchRequiredStatus: req.body.status } })
            await send_Notification_mail(pitch.email, pitch.email, `Pitch required status update !`, `For ${pitch.title}(${pitch._id}) required status has been updated to ${req.body.status}`, pitch.userInfo.userName)
            return res.status(200).json('Pitch updated')
        }
        return res.status(400).json('No Pitch Found')
    } catch (err) {
        return res.status(400).json(err)
    }
}



exports.fetchUserPitches = async (req, res, next) => {
    try {
        const result = await Pitch.find({ userInfo: req.payload.user_id }).populate({ path: 'userInfo', select: [ 'userName', 'image', 'role'] });
        return res.status(200).json(result)
    } catch (err) {
        return res.status(400).json(err)
    }
}

exports.fetchReceivedPitches = async (req, res, next) => {
    try {
        const result = await Pitch.find({ associatedTo: {$in: [req.payload.user_id]} }).populate({ path: 'userInfo', select: ['userName', 'image', 'role'] });
        return res.status(200).json(result)
    } catch (err) {
        return res.status(400).json(err)
    }
}



exports.userLivePitch = async (req, res, next) => {
    try {
        const livePitches = await Pitch.find({ status: 'approved',  userInfo: req.payload.user_id })
        return res.status(200).json(livePitches)
    } catch (err) {
        return res.status(400).json(err)
    }
}

exports.fetchLivePitch = async (req, res, next) => {
    try {
        const livePitches = await Pitch.find({ status: 'approved', pitchRequiredStatus: 'show' }).populate({ path: 'userInfo', select: [ 'userName', 'image', 'role', 'state', 'town', 'country'] })
        return res.status(200).json(livePitches)
    } catch (err) {
        return res.status(400).json(err)
    }
}

exports.addPitchComment = async (req, res, next) => {
    try {
        const pitch = await Pitch.findOne({ _id: req.body.pitchId })
        if (pitch) {
            const user = await User.findOne({ email: req.body.comment.email })
            await Pitch.updateOne({ _id: req.body.pitchId }, { $push: { 'comments': { ...req.body.comment, commentBy: user._id, createdAt: new Date() } } })
            return res.status(200).json('Comment added')

        }
        return res.status(400).json('No Pitch Found')
    } catch (err) {
        return res.status(400).json(err)
    }
}

exports.addPitchSubComment = async (req, res, next) => {
    try {
        const pitch = await Pitch.findOne({ _id: req.body.pitchId, 'comments._id': req.body.commentId })
        if (pitch) {
            const user = await User.findOne({ email: req.body.email })
            await Pitch.updateOne({ _id: req.body.pitchId, 'comments._id': req.body.commentId }, { $push: { 'comments.$.subComments': { comment: req.body.comment, commentBy: user._id, createdAt: new Date() } } })
            return res.status(200).json('Comment added')

        }
        return res.status(400).json('No Pitch Found')
    } catch (err) {
        console.log(err);
        return res.status(400).json(err)
    }
}

exports.removePitchComment = async (req, res, next) => {
    try {
        const pitch = await Pitch.findOne({ _id: req.body.pitchId })
        if (pitch) {
            const commentExist = await Pitch.findOne({ 'comments._id': req.body.commentId })
            await Pitch.updateOne({ _id: req.body.pitchId }, { $pull: { 'comments': { _id: req.body.commentId } } })
            return res.status(200).json('Comment Deleted')
        }
        return res.status(400).json('No Pitch Found')
    } catch (err) {
        return res.status(400).json(err)
    }
}

exports.addIntrest = async (req, res, next) => {
    try {
        const pitch = await Pitch.findOne({ _id: req.body.pitchId }).populate({ path: 'userInfo', select: [ 'userName', 'image', 'role'] });
        if (pitch) {
            const userExist = await Pitch.findOne({ _id: req.body.pitchId, 'intrest.email': { $in: [req.body.email] } })
            if (userExist) {
                return res.status(400).json('user already in the intrest list')
            }
            const user = await User.findOne({ email: req.body.email })
            await Pitch.updateOne({ _id: req.body.pitchId }, { $push: { 'intrest': { email: req.body.email, intrestBy: user._id, createdAt: new Date() } } })
            await send_Notification_mail(pitch.email, pitch.email, `Added new Interest !`, `${user.userName} has added pitch ${pitch.title}(${pitch._id}) into their interest list. Check notification for more info.`, pitch.userInfo.userName)
            await Notification.create({ senderInfo: user._id, receiver: pitch.userInfo, message: `${user.userName} has added ${pitch.title}(${pitch._id}) into their interest list.`, type: 'pitch', read: false })
            return res.status(200).json('Intrest added')

        }
        return res.status(400).json('No Pitch Found')
    } catch (err) {
        return res.status(400).json(err)
    }
}


exports.removeFromIntrest = async (req, res, next) => {
    try {
        const pitch = await Pitch.findOne({ _id: req.body.pitchId }).populate({ path: 'userInfo', select: [ 'userName', 'image', 'role'] });
        if (pitch) {
            const userExist = await Pitch.findOne({ _id: req.body.pitchId, 'intrest.email': { $in: [req.body.email] } })
            if (userExist) {
                const user = await User.findOne({ email: req.body.email })
                await Pitch.updateOne({ _id: req.body.pitchId }, { $pull: { 'intrest': { email: req.body.email } } })
                await send_Notification_mail(pitch.email, pitch.email, `Removed from Interest !`, `${user.userName} has removed pitch ${pitch.title}(${pitch._id}) from their interest list. Check notification for more info.`, pitch.userInfo.userName)
                await Notification.create({ senderInfo: user._id, receiver: pitch.userInfo, message: `${user.userName} has removed ${pitch.title}(${pitch._id}) from their interest list.`, type: 'pitch', read: false })
                return res.status(200).json('User removed from intrest list')
            }
            return res.status(400).json('user not in the intrest list')

        }
        return res.status(400).json('No Pitch Found')
    } catch (err) {
        return res.status(400).json(err)
    }
}



exports.addReviewStars = async (req, res, next) => {
    try {
        const pitch = await Pitch.findOne({ _id: req.body.pitchId }).populate({ path: 'userInfo', select: [ 'userName', 'image', 'role'] });
        if (pitch) {
            const userExists = await Pitch.findOne({ '_id': req.body.pitchId, 'review.email': req.body.review.email })
            if (userExists) {
                await Pitch.updateOne({ '_id': req.body.pitchId, 'review.email': req.body.review.email }, { 'review.$.review': req.body.review.review })
                return res.status(200).json('Review updated')
            }
            const user = await User.findOne({ email: req.body.review.email })
            await Pitch.updateOne({ _id: req.body.pitchId }, { $push: { 'review': { ...req.body.review, 'reviewBy': user._id } } })
            await send_Notification_mail(pitch.email, pitch.email, `Added Stars to the pitch!`, `${user.userName} has added ${req.body.review.review} stars to the ${pitch.title}(${pitch._id}) pitch. Check notification for more info.`, pitch.userInfo.userName)
            await Notification.create({ senderInfo: user._id, receiver: pitch.userInfo, message: `${user.userName} has added ${req.body.review.review} stars to the ${pitch.title}(${pitch._id}) pitch.`, type: 'pitch', read: false })
            return res.status(200).json('Review added')

        }
        return res.status(400).json('No Pitch Found')
    } catch (err) {
        return res.status(400).json(err)
    }
}

exports.getReviewStars = async (req, res, next) => {
    try {
        const pitch = await Pitch.findOne({ _id: req.body.pitchId, 'review.email': req.body.email }, { 'review.$': 1 }).populate({ path: 'review.reviewBy', select: [ 'userName', 'image', 'role'] })
        if (pitch) {
            return res.status(200).json(pitch.review.length > 0 && pitch.review[0])

        }
        return res.status(200).json({})
    } catch (err) {
        return res.status(400).json(err)
    }
}


exports.fetchAllPitch = async (req, res, next) => {
    try {
        const AllPitches = await Pitch.find().populate({ path: 'userInfo', select: [ 'userName', 'image', 'role', 'state', 'town', 'country', 'verification'] })
        return res.status(200).json(AllPitches)
    } catch (err) {
        return res.status(400).json(err)
    }
}

exports.changePitchStatus = async (req, res, next) => {
    try {
        const { pitchId, status, reason } = req.body;
        const pitch = await Pitch.findOne({ _id: pitchId }).populate({ path: 'userInfo', select: [ 'userName', 'image', 'role'] });
        const changedPitch = await Pitch.updateOne({ _id: pitchId }, { $set: { status: status } })
        const adminDetails = await User.findOne({ email: process.env.ADMIN_EMAIL })

        if (status == 'rejected') {
            await send_Notification_mail(pitch.email, pitch.email, `Pitch status update !`, `For pitch ${pitch.title}(${pitch._id}) status has been updated to ${req.body.status} by the admin and added comment: "${reason}"`, pitch.userInfo.userName)
            await Notification.create({ senderInfo: adminDetails._id, receiver: pitch.userInfo, message: `For pitch ${pitch.title}(${pitch._id}) status has been updated to ${req.body.status} by the admin : "${reason}"`, type: 'pitch', read: false })
            return res.status(200).json(changedPitch)

        }
        await send_Notification_mail(pitch.email, pitch.email, `Pitch status update !`, `For pitch ${pitch.title}(${pitch._id}) status has been updated to ${req.body.status} by the admin`, pitch.userInfo.userName)
        await Notification.create({ senderInfo: adminDetails._id, receiver: pitch.userInfo, message: `For pitch ${pitch.title}(${pitch._id}) status has been updated to ${req.body.status} by the admin`, type: 'pitch', read: false })

        return res.status(200).json(changedPitch)
    } catch (err) {
        return res.status(400).json(err)
    }
}


exports.recentPitchOfUser = async (req, res, next) => {
    try {
        const { email } = req.body;
        const recentPitch = await Pitch.find({ email: email }).sort({ _id: -1 }).limit(1)
        return res.status(200).json(recentPitch)
    } catch (err) {
        return res.status(400).json(err)
    }
}



