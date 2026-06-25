// Elo rating formula
// Returns { winnerDelta, loserDelta } — both are POSITIVE integers.
// Caller is responsible for: winner += winnerDelta, loser -= loserDelta

const calculateEloChange = (winnerRating, loserRating, winnerGamesPlayed, loserGamesPlayed) => {

    const Ka = winnerGamesPlayed < 30 ? 32 : 16;
    const Kb = loserGamesPlayed  < 30 ? 32 : 16;

    // Expected probability that winner beats loser
    const Ea = 1 / (1 + 10 ** ((loserRating - winnerRating) / 400));
    // Eb = 1 - Ea always (expected scores must sum to 1)

    const winnerDelta = Math.min(32, Math.round(Ka * (1 - Ea)));  // winner gained
    const loserDelta  = Math.min(32, Math.round(Kb * (1 - Ea)));   // loser lost — same magnitude as winner gained (zero-sum)

    return { winnerDelta, loserDelta };
}

export default calculateEloChange;