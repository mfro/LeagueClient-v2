import Module        from './../../../../ui/module';
import * as Assets   from './../../../../../frontend/assets';
import * as Summoner from './../../../../../frontend/summoner';
import StatGroup     from './statgroup';

var template = (
    <module class="matchstats">
        <div class="header" data-ref="header">
            <div class="label-spacer"></div>
        </div>
        <div class="stat-table" data-ref="table"/>
    </module>
);

var head = (
    <div class="matchstats-head" style="background-image: url('{{ iconurl }}');"></div>
);

const stats = {
    'General': {
        '_KDA': 'KDA',
        'largestKillingSpree': 'Largest Killing Spree',
        'largestMultiKill': 'Largest Multi Kill',
        '_FIRSTBLOOD': 'First Blood'
    },
    'Damage Dealt to Champions': {
        'totalDamageDealtToChampions': 'Total',
        'physicalDamageDealtToChampions': 'Physical',
        'magicDamageDealtToChampions': 'Magic',
        'trueDamageDealtToChampions': 'True'
    },
    'Damage Dealt': {
        'totalDamageDealt': 'Total',
        'physicalDamageDealt': 'Physical',
        'magicDamageDealt': 'Magic',
        'trueDamageDealt': 'True',
        'largestCriticalStrike': 'Larges Critical'
    },
    'Damage Taken': {
        'totalDamageTaken': 'Total',
        'physicalDamageTaken': 'Physical',
        'magicalDamageTaken': 'Magic',
        'trueDamageTaken': 'True',
        'totalHeal': 'Healed'
    },
    'Vision': {
        'wardsPlaced': 'Wards Placed',
        'wardsKilled': 'Wards Killed',
        'sightWardsBoughtInGame': 'Stealth Wards Purchased',
        'visionWardsBoughtInGame': 'Vision Wards Purchased'
    },
    'Income': {
        'goldEarned': 'Gold Earned',
        'goldSpent': 'Gold Spent',
        'totalMinionsKilled': 'Minions Killed',
        'neutralMinionsKilled': 'Jungle Monsters Killed',
        'neutralMinionsKilledEnemyJungle': 'Monsters Counter-Jungled'
    }
};

interface Refs {
    header: Swish;
    table: Swish;
}

export default class MatchStats extends Module<Refs> {
    public constructor(summ: Domain.Summoner.SummonerSummary, details: Domain.MatchHistory.MatchDetails) {
        super(template);

        let ordered = details.participants;
        ordered.sort((a, b) => a.teamId - b.teamId);

        let myIdent = details.participantIdentities.first(i => i.player && i.player.accountId == summ.accountId);

        for (let part of ordered) {
            let node = Module.create(head);
            node.node.setBackgroundImage(Assets.champion.icon(part.championId));
            node.render(this.refs.header);
        }

        for (let name in stats) {
            let group = new StatGroup(name, stats[name], ordered, myIdent.participantId);
            group.render(this.refs.table);
        }
    }
}