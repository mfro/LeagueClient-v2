import Module         from './../ui/module';
import * as Tabs      from './../uikit/tabs';
import * as Assets    from './../../frontend/assets';
import { Champions }  from './../../backend/services';
import * as Summoner  from './../../frontend/summoner';

import OverviewPage   from './overview';
import MatchesPage    from './matches/history';

var template = (
    <module class="profile">
        <div class="background" data-ref="background"/>
        <div class="header">
            <div class="tab-button" data-ref="tab0" id><span>OVERVIEW</span></div>
            <div class="tab-button" data-ref="tab1" id><span>MATCH HISTORY</span></div>
            <div class="tab-button" data-ref="tab2"><span>RANKINGS</span></div>

            <x-flexpadd></x-flexpadd>

            <div class="search-area">
                <span class="exit-button" data-ref="home"/>
                <input type="text" class="search-box" data-ref="search"/>
            </div>
        </div>
        <div class="center" data-ref="mainScroller">
            <container data-ref="overviewContainer"/>
            <container data-ref="matchesContainer"/>
            <container data-ref="rankedContainer"/>
        </div>
    </module>
);

interface Refs {
    search: Swish;
    home: Swish;

    background: Swish;

    overviewContainer: Swish;
    matchesContainer: Swish;
    mainScroller: Swish;
}

export default class ProfilePage extends Module<Refs> {
    private tabChange: (index: number) => void;

    private overview: OverviewPage;
    private matches: MatchesPage;

    public constructor() {
        super(template);

        let tabs = []
        for (var i = 0; i < 3; i++) tabs[i] = this.refs['tab' + i];
        this.tabChange = Tabs.create(tabs, 0, (old, now) => this.onTabChange(old, now));

        let reset = () => {
            this.refs.search.value = '';
            Summoner.me.single(me => {
                Summoner.get(me.name).then(s => this.load(s));
            });
        };

        this.refs.search.on('change', () => this.search());
        this.refs.home.on('click', e => reset());
        reset();
    }

    private search() {
        let name = this.refs.search.value;
        Summoner.get(name).then(summ => {
            this.load(summ);
        }).catch(() => {
            console.log('not found');
        });
    }

    private load(summ: Domain.Summoner.SummonerSummary) {
        if (this.overview) this.overview.dispose();
        if (this.matches) this.matches.dispose();

        Summoner.me.single(me => {
            this.refs.home.setClass(me.accountId != summ.accountId, 'visible');
        });

        this.refs.overviewContainer.empty();
        this.refs.matchesContainer.empty();

        this.overview = new OverviewPage(summ);
        this.overview.render(this.refs.overviewContainer);

        this.matches = new MatchesPage(summ);
        this.matches.render(this.refs.matchesContainer);

        Champions.mastery(summ.summonerId).then(list => {
            let champ = list.any() ? list[0].championId : Assets.gamedata.champions.random().id;

            this.refs.background.setBackgroundImage(Assets.champion.splash(champ, 0));
        });
    }

    private onTabChange(old: number, now: number) {
        this.refs.background.setClass(now > 0, 'blurred');

        let ratio = now / this.refs.mainScroller.children.length;
        this.refs.mainScroller.css('transform', 'translateX(' + (-ratio * 100) + '%)');
    }
}