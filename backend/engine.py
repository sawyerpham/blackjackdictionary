"""Composition-dependent blackjack EV engine (Python port of the old TS engine).

evaluate(player, dealer_up, shoe, rules, splits_already_taken) -> EV of every legal action.

shoe: counts of cards still in the shoe, index 0 = Ace, 1..8 = 2..9, 9 = ten-value.
Hand state is (t, aces): t counts every ace as 1; soft upgrades one ace to 11 when it fits.

Known simplification: split hands each draw from the same starting shoe independently
(no sequential depletion between split hands). Resplits, split aces, peek conditioning
and double restrictions are exact.
"""

RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10']
RANK_INDEX = {r: i for i, r in enumerate(RANKS)}

VEGAS_6DECK = {
    'decks': 6, 'hitSoft17': True, 'doubleAfterSplit': True, 'lateSurrender': True,
    'blackjackPays': 1.5, 'dealerPeeks': True, 'allowDoubleDown': True,
    'doubleDownRestriction': 'any', 'maxSplits': 3, 'allowResplitAces': False,
    'allowDrawAfterSplitAces': False,
}


def fresh_shoe(decks):
    return [4 * decks] * 9 + [16 * decks]


def rank_value(i):
    return 1 if i == 0 else 10 if i == 9 else i + 1


def hand_of(cards):
    t = sum(rank_value(RANK_INDEX[c]) for c in cards)
    return t, sum(1 for c in cards if c == 'A')


def add_rank(h, i):
    return h[0] + rank_value(i), h[1] + (i == 0)


def best_total(h):
    return h[0] + 10 if h[1] and h[0] + 10 <= 21 else h[0]


def is_soft(h):
    return bool(h[1]) and h[0] + 10 <= 21


def remove_card(shoe, i):
    s = list(shoe)
    s[i] -= 1
    return tuple(s)


def is_double_allowed(h, restriction):
    total, soft = best_total(h), is_soft(h)
    return {
        'any': True,
        'hard9to11': not soft and 9 <= total <= 11,
        'hard10or11': not soft and 10 <= total <= 11,
        'hard9to11AndSoft': soft or 9 <= total <= 11,
    }[restriction]


def dealer_dist(h, shoe, rules, cards_dealt, memo):
    """Final-total distribution: keys 17..21, 'bust', 'natural' (2-card 21)."""
    tot = best_total(h)
    if tot > 21:
        return {'bust': 1.0}
    if cards_dealt == 2 and tot == 21:
        return {'natural': 1.0}
    if tot > 17 or (tot == 17 and not (is_soft(h) and rules['hitSoft17'])):
        return {tot: 1.0}
    # Different draw orders converge on the same (hand, shoe); memo keeps it polynomial.
    key = (h, shoe)
    if key in memo:
        return memo[key]
    total = sum(shoe)
    dist = {}
    for i in range(10):
        if shoe[i]:
            p = shoe[i] / total
            for k, v in dealer_dist(add_rank(h, i), remove_card(shoe, i), rules, cards_dealt + 1, memo).items():
                dist[k] = dist.get(k, 0.0) + p * v
    memo[key] = dist
    return dist


def make_dealer_dist_fn(dealer_up, rules):
    memo, h = {}, hand_of([dealer_up])
    return lambda shoe: dealer_dist(h, shoe, rules, 1, memo)


def make_conditioned_dealer_dist_fn(dealer_up, exclude_idx, rules):
    """Dealer distribution given the hole card is NOT exclude_idx (peek came back clean)."""
    memo, h, cache = {}, hand_of([dealer_up]), {}

    def fn(shoe):
        if shoe in cache:
            return cache[shoe]
        available = sum(shoe) - shoe[exclude_idx]
        dist = {}
        if available > 0:
            for i in range(10):
                if i != exclude_idx and shoe[i]:
                    p = shoe[i] / available
                    for k, v in dealer_dist(add_rank(h, i), remove_card(shoe, i), rules, 2, memo).items():
                        dist[k] = dist.get(k, 0.0) + p * v
        cache[shoe] = dist
        return dist
    return fn


def ev_stand(player_total, dd):
    ev = 0.0
    for k, p in dd.items():
        if k == 'bust':
            ev += p
        elif k == 'natural':  # callers are never naturals, so a dealer natural always wins
            ev -= p
        elif k < player_total:
            ev += p
        elif k > player_total:
            ev -= p
    return ev


def ev_play(h, shoe, rules, ddf, memo):
    """Best of stand or hit, playing the hand out optimally."""
    if h[0] > 21:
        return -1.0
    key = (h, shoe)
    if key not in memo:
        memo[key] = max(ev_stand(best_total(h), ddf(shoe)), ev_hit(h, shoe, rules, ddf, memo))
    return memo[key]


def ev_hit(h, shoe, rules, ddf, memo):
    total = sum(shoe)
    return sum(shoe[i] / total * ev_play(add_rank(h, i), remove_card(shoe, i), rules, ddf, memo)
               for i in range(10) if shoe[i])


def ev_double(h, shoe, ddf):
    """Exactly one card, then stand, stake doubled (NOT 2 * ev_hit)."""
    total = sum(shoe)
    ev = 0.0
    for i in range(10):
        if shoe[i]:
            nh, s2 = add_rank(h, i), remove_card(shoe, i)
            ev += shoe[i] / total * (-1.0 if nh[0] > 21 else ev_stand(best_total(nh), ddf(s2)))
    return 2 * ev


def ev_split_pair(pair_idx, shoe, rules, ddf, memo, splits_so_far):
    aces = pair_idx == 0
    total = sum(shoe)
    ev = 0.0
    for i in range(10):
        if not shoe[i]:
            continue
        s2 = remove_card(shoe, i)
        nh = add_rank(hand_of([RANKS[pair_idx]]), i)
        if i == pair_idx and splits_so_far < rules['maxSplits'] and (not aces or rules['allowResplitAces']):
            outcome = ev_split_pair(pair_idx, s2, rules, ddf, memo, splits_so_far + 1)
        elif aces and not rules['allowDrawAfterSplitAces']:
            outcome = -1.0 if nh[0] > 21 else ev_stand(best_total(nh), ddf(s2))
        else:
            outcome = ev_play(nh, s2, rules, ddf, memo)
            if rules['doubleAfterSplit']:
                outcome = max(outcome, ev_double(nh, s2, ddf))
        ev += shoe[i] / total * outcome
    return 2 * ev


def evaluate(player, dealer_up, shoe, rules=VEGAS_6DECK, splits_already_taken=0):
    shoe = tuple(shoe)
    h = hand_of(player)
    two = len(player) == 2
    pair = two and RANK_INDEX[player[0]] == RANK_INDEX[player[1]]

    if two and best_total(h) == 21:
        return {'best': 'stand', 'ev': {'stand': rules['blackjackPays']}, 'isBlackjack': True}

    up = RANK_INDEX[dealer_up]
    # Peek only matters when the upcard could hide a natural: A needs a ten, 10 needs an ace.
    bj_hole = 9 if up == 0 else 0 if up == 9 else -1
    n = sum(shoe)
    p_bj = shoe[bj_hole] / n if rules['dealerPeeks'] and bj_hole != -1 and n > 0 else 0.0

    plain = make_dealer_dist_fn(dealer_up, rules)
    acting = make_conditioned_dealer_dist_fn(dealer_up, bj_hole, rules) if p_bj > 0 else plain

    # Stand/hit risk only the original bet, so peek timing washes out; double/split don't.
    ev = {
        'stand': ev_stand(best_total(h), plain(shoe)),
        'hit': ev_hit(h, shoe, rules, plain, {}),
    }
    if two and rules['allowDoubleDown'] and is_double_allowed(h, rules['doubleDownRestriction']):
        ev['double'] = -p_bj + (1 - p_bj) * ev_double(h, shoe, acting)
    if pair and splits_already_taken < rules['maxSplits']:
        ev['split'] = -p_bj + (1 - p_bj) * ev_split_pair(
            RANK_INDEX[player[0]], shoe, rules, acting, {}, splits_already_taken + 1)
    if two and rules['lateSurrender']:
        # Late surrender comes after the peek: a dealer natural still takes the whole bet.
        ev['surrender'] = -p_bj + (1 - p_bj) * -0.5

    return {'best': max(ev, key=ev.get), 'ev': ev, 'isBlackjack': False}


# ---------------------------------------------------------------------------
# Basic strategy chart. The exact engine needs minutes for a full chart, so this
# removes the three dealt cards and then holds the card odds fixed (the standard
# chart-generator approximation). Same rules model, milliseconds per chart.
# ---------------------------------------------------------------------------

UPCARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A']
CHART_ROWS = {
    'hard': [('17+', '10', '7'), ('16', '10', '6'), ('15', '10', '5'), ('14', '10', '4'), ('13', '10', '3'),
             ('12', '10', '2'), ('11', '8', '3'), ('10', '6', '4'), ('9', '6', '3'), ('8', '5', '3')],
    'soft': [(f'A,{r}', 'A', r) for r in '98765432'],
    'pairs': [(f'{r},{r}', r, r) for r in ['A', '10', '9', '8', '7', '6', '5', '4', '3', '2']],
}


def _cell_ev(player, up, rules):
    """EV per action, conditioned on no dealer natural when the dealer peeks."""
    shoe = fresh_shoe(rules['decks'])
    for c in player + [up]:
        shoe[RANK_INDEX[c]] -= 1
    n = sum(shoe)
    p = [c / n for c in shoe]
    ui = RANK_INDEX[up]
    bj_hole = 9 if ui == 0 else 0 if ui == 9 else -1
    peeked = rules['dealerPeeks'] and bj_hole != -1

    memo = {}

    def dealer(h, dealt):
        tot = best_total(h)
        if tot > 21:
            return {'bust': 1.0}
        if dealt == 2 and tot == 21:
            return {'natural': 1.0}
        if tot > 17 or (tot == 17 and not (is_soft(h) and rules['hitSoft17'])):
            return {tot: 1.0}
        if (h, dealt) in memo:
            return memo[(h, dealt)]
        probs = p
        if dealt == 1 and peeked:  # hole card known not to complete a natural
            probs = [0.0 if i == bj_hole else x / (1 - p[bj_hole]) for i, x in enumerate(p)]
        dist = {}
        for i in range(10):
            if probs[i]:
                for k, v in dealer(add_rank(h, i), dealt + 1).items():
                    dist[k] = dist.get(k, 0.0) + probs[i] * v
        memo[(h, dealt)] = dist
        return dist

    dd = dealer(hand_of([up]), 1)
    play_memo = {}

    def stand(h):
        return ev_stand(best_total(h), dd)

    def play(h):
        if h[0] > 21:
            return -1.0
        if h not in play_memo:
            play_memo[h] = max(stand(h), hit(h))
        return play_memo[h]

    def hit(h):
        return sum(p[i] * play(add_rank(h, i)) for i in range(10) if p[i])

    def double(h):
        return 2 * sum(p[i] * (-1.0 if add_rank(h, i)[0] > 21 else stand(add_rank(h, i))) for i in range(10) if p[i])

    def split(pi, splits):
        aces = pi == 0
        ev = 0.0
        for i in range(10):
            if not p[i]:
                continue
            nh = add_rank(hand_of([RANKS[pi]]), i)
            if i == pi and splits < rules['maxSplits'] and (not aces or rules['allowResplitAces']):
                out = split(pi, splits + 1)
            elif aces and not rules['allowDrawAfterSplitAces']:
                out = -1.0 if nh[0] > 21 else stand(nh)
            else:
                out = play(nh)
                if rules['doubleAfterSplit'] and rules['allowDoubleDown']:
                    out = max(out, double(nh))
            ev += p[i] * out
        return 2 * ev

    h = hand_of(player)
    ev = {'stand': stand(h), 'hit': hit(h)}
    if rules['allowDoubleDown'] and is_double_allowed(h, rules['doubleDownRestriction']):
        ev['double'] = double(h)
    if player[0] == player[1] and rules['maxSplits'] > 0:
        ev['split'] = split(RANK_INDEX[player[0]], 1)
    if rules['lateSurrender']:
        ev['surrender'] = -0.5
    return ev


def chart_code(ev):
    """S, H, D (double else hit), Ds (double else stand), P, Rh/Rs/Rp (surrender else ...)."""
    best = max(ev, key=ev.get)
    if best == 'double':
        return 'D' if ev['hit'] >= ev['stand'] else 'Ds'
    if best == 'surrender':
        rest = {k: v for k, v in ev.items() if k in ('hit', 'stand', 'split')}
        return 'R' + {'hit': 'h', 'stand': 's', 'split': 'p'}[max(rest, key=rest.get)]
    return {'stand': 'S', 'hit': 'H', 'split': 'P'}[best]


def chart(rules):
    return {
        kind: [{'hand': label, 'cells': [chart_code(_cell_ev([a, b], up, rules)) for up in UPCARDS]}
               for label, a, b in rows]
        for kind, rows in CHART_ROWS.items()
    }


if __name__ == '__main__':
    import time
    s = fresh_shoe(6)
    for r in ['10', '7', '10']:
        s[RANK_INDEX[r]] -= 1
    r = evaluate(['10', '7'], '10', s)
    assert r['best'] in ('stand', 'surrender') and -0.6 < r['ev']['stand'] < -0.3, r
    s = fresh_shoe(6)
    for c in ['8', '8', '6']:
        s[RANK_INDEX[c]] -= 1
    r = evaluate(['8', '8'], '6', s)
    assert r['best'] == 'split', r
    s = fresh_shoe(6)
    for c in ['6', '5', '6']:
        s[RANK_INDEX[c]] -= 1
    r = evaluate(['6', '5'], '6', s)
    assert r['best'] == 'double', r
    t = time.perf_counter()
    s = fresh_shoe(6)
    for c in ['2', '2', '2']:
        s[RANK_INDEX[c]] -= 1
    evaluate(['2', '2'], '2', s)
    print(f'ok (worst-ish case 2,2 v 2: {time.perf_counter() - t:.2f}s)')
