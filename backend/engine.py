"""Composition-dependent blackjack EV engine (Python port of the old TS engine).

evaluate(player, dealer_up, shoe, rules, splits_already_taken) -> EV of every legal action.

shoe: counts of cards still in the shoe, index 0 = Ace, 1..8 = 2..9, 9 = ten-value.
Hand state is (t, aces): t counts every ace as 1; soft upgrades one ace to 11 when it fits.

Stand, hit and double are exact for the given shoe. Split uses fixed_odds_ev: the real shoe's
card odds, held fixed from there (exact split takes seconds for small pairs vs small upcards).
"""

from functools import lru_cache

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
        # Exact split EV recurses through every shoe state (~6s for 3,3 v 3); fixed odds take ms.
        split_ev = fixed_odds_ev(player, dealer_up, shoe, rules, splits_already_taken)['split']
        ev['split'] = -p_bj + (1 - p_bj) * split_ev
    if two and rules['lateSurrender']:
        # Late surrender comes after the peek: a dealer natural still takes the whole bet.
        ev['surrender'] = -p_bj + (1 - p_bj) * -0.5

    return {'best': max(ev, key=ev.get), 'ev': ev, 'isBlackjack': False}


# ---------------------------------------------------------------------------
# Fixed-odds model: take the shoe as it is now, then hold the card odds fixed
# (the standard chart-generator approximation). Same rules model, milliseconds.
# Used for the whole basic strategy chart and for split EV in evaluate().
# ---------------------------------------------------------------------------

UPCARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A']
CHART_ROWS = {
    'hard': [('17+', '10', '7'), ('16', '10', '6'), ('15', '10', '5'), ('14', '10', '4'), ('13', '10', '3'),
             ('12', '10', '2'), ('11', '8', '3'), ('10', '6', '4'), ('9', '6', '3'), ('8', '5', '3')],
    'soft': [(f'A,{r}', 'A', r) for r in '98765432'],
    'pairs': [(f'{r},{r}', r, r) for r in ['A', '10', '9', '8', '7', '6', '5', '4', '3', '2']],
}


def fixed_odds_ev(player, up, shoe, rules, splits_taken=0):
    """EV per action from `shoe` (cards still unseen), conditioned on no dealer natural when
    the dealer peeks. `splits_taken` = splits already made on this hand's lineage."""
    n = sum(shoe)
    p = [c / n for c in shoe]
    ui = RANK_INDEX[up]
    bj_hole = 9 if ui == 0 else 0 if ui == 9 else -1
    peeked = rules['dealerPeeks'] and bj_hole != -1 and p[bj_hole] < 1

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
    if len(player) == 2 and player[0] == player[1] and splits_taken < rules['maxSplits']:
        ev['split'] = split(RANK_INDEX[player[0]], splits_taken + 1)
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


def _dealt_shoe(rules, *cards):
    shoe = fresh_shoe(rules['decks'])
    for c in cards:
        shoe[RANK_INDEX[c]] -= 1
    return shoe


def chart(rules):
    return {
        kind: [{'hand': label, 'cells': [chart_code(fixed_odds_ev([a, b], up, _dealt_shoe(rules, a, b, up), rules))
                                          for up in UPCARDS]}
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



@lru_cache(maxsize=1024)
def _edge_parts(key):
    """(EV from non-natural hands, P(player natural that the dealer doesn't match)) per initial bet.
    Blackjack payout enters linearly as payout * the second term, so it never needs a recompute."""
    rules = dict(key)
    shoe0 = fresh_shoe(rules['decks'])
    n = sum(shoe0)
    ev, natural = 0.0, 0.0
    for a in range(10):
        for b in range(a, 10):
            for u in range(10):
                s = list(shoe0)
                p = s[a] / n
                s[a] -= 1
                p *= s[b] / (n - 1)
                s[b] -= 1
                p *= s[u] / (n - 2)
                s[u] -= 1
                if not p:
                    continue
                if a != b:
                    p *= 2  # either card order
                bj_hole = 9 if u == 0 else 0 if u == 9 else -1
                p_bj = s[bj_hole] / sum(s) if bj_hole != -1 else 0.0
                if {a, b} == {0, 9}:  # player natural: pushes a dealer natural, else paid
                    natural += p * (1 - p_bj)
                    continue
                best = max(fixed_odds_ev([RANKS[a], RANKS[b]], RANKS[u], s, rules).values())
                # With a peek those EVs assume no dealer natural; a natural takes the bet first.
                ev += p * (-p_bj + (1 - p_bj) * best if rules['dealerPeeks'] and p_bj else best)
    return ev, natural


def house_edge(rules):
    """House edge in % of the initial bet, playing the best action (fixed-odds model) on every
    starting deal: both player cards and the upcard drawn from a full shoe, weighted by probability."""
    ev, natural = _edge_parts(tuple(sorted((k, v) for k, v in rules.items() if k != 'blackjackPays')))
    return -(ev + rules['blackjackPays'] * natural) * 100


# Base game for the breakdown: 6 decks, S17, 3:2, peek, double any two, DAS, no surrender,
# split to 4 hands, no resplit/hit on split aces.
EDGE_BASELINE = {**VEGAS_6DECK, 'hitSoft17': False, 'lateSurrender': False}

def _yes(v):
    return 'Allowed' if v else 'Not allowed'


EDGE_FACTORS = [
    ('Decks', ('decks',), lambda r: f"{r['decks']} deck{'s' if r['decks'] > 1 else ''}"),
    ('Soft 17', ('hitSoft17',), lambda r: 'Dealer hits' if r['hitSoft17'] else 'Dealer stands'),
    ('Blackjack pays', ('blackjackPays',), lambda r: {1.5: '3:2', 1.2: '6:5', 1: '1:1'}.get(r['blackjackPays'], str(r['blackjackPays']))),
    ('Dealer peek', ('dealerPeeks',), lambda r: 'Peeks' if r['dealerPeeks'] else 'No peek'),
    ('Doubling', ('allowDoubleDown', 'doubleDownRestriction'), lambda r: {
        'any': 'Any two cards', 'hard9to11': 'Hard 9–11', 'hard10or11': 'Hard 10–11', 'hard9to11AndSoft': '9–11 + soft',
    }[r['doubleDownRestriction']] if r['allowDoubleDown'] else 'Not allowed'),
    ('Double after split', ('doubleAfterSplit',), lambda r: _yes(r['doubleAfterSplit'])),
    ('Late surrender', ('lateSurrender',), lambda r: _yes(r['lateSurrender'])),
    ('Splitting', ('maxSplits',), lambda r: f"Up to {r['maxSplits'] + 1} hands"),
    ('Resplit aces', ('allowResplitAces',), lambda r: _yes(r['allowResplitAces'])),
    ('Hit split aces', ('allowDrawAfterSplitAces',), lambda r: _yes(r['allowDrawAfterSplitAces'])),
]


def house_edge_breakdown(rules):
    """Base-game edge, then each rule switched from the base value to `rules` one at a time (in
    EDGE_FACTORS order); each delta is that rule's effect, and the deltas sum to the total.
    Rules still at their base value cost no computation."""
    cur = dict(EDGE_BASELINE)
    base = prev = house_edge(cur)
    factors = []
    for label, keys, fmt in EDGE_FACTORS:
        for k in keys:
            cur[k] = rules[k]
        edge = house_edge(cur)
        factors.append({'factor': label, 'setting': fmt(rules), 'delta': round(edge - prev, 3),
                        'isBase': all(rules[k] == EDGE_BASELINE[k] for k in keys)})
        prev = edge
    return {'base': round(base, 3), 'factors': factors, 'total': round(prev, 3)}
