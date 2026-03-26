function normalizeUserForMatching(user) {

  if (!user) {
    throw new Error("User is null in normalizeUserForMatching");
  }

  const industries = new Set(user.industries || []);
  const skills = new Set(user.skills || []);
  const expertise = new Set(user.expertise || []);

  if (user.mentorExpertise?.length) {
    user.mentorExpertise.forEach(me => {
      if (me.industry) industries.add(me.industry);
      me.skills?.forEach(s => skills.add(s));
    });
  }

  return {
    userId: user._id,
    experience: user.experienceYears || 0,
    industries: [...industries],
    skills: [...skills, ...expertise],
    interests: user.interests || [],
  };
}
const QuickMatchRoom = require("../../models/quickMatchRoomSchema");

const overlap = (a,b) => a.filter(x => b.includes(x));

async function findSuitableRoom(normalUser) {

  const rooms = await QuickMatchRoom.find({
    isLocked: false
  });

  for (const room of rooms) {

    if (room.participants.length >= room.maxParticipants)
      continue;

    // EXPERIENCE RULE
    if (
      normalUser.experience < room.minExperience - 3 ||
      normalUser.experience > room.maxExperience + 3
    )
      continue;

    // REQUIRED → Industry MATCH
    const skillMatch = overlap(
      normalUser.industries,
      room.sharedIndustries
    );

    if (!skillMatch.length) continue;

    return room;
  }

  return null;
}

module.exports = { findSuitableRoom,normalizeUserForMatching };