import Module          from './../../ui/module';
import * as Assets     from './../../../frontend/assets';
import * as Summoner   from './../../../frontend/summoner';

import { PlayLoop as Service } from './../../../backend/services';

import ChatRoom        from './../../chat/room/chatroom';
import * as Invite     from './../../invite/panel';

const html = Module.import('playloop/custom');

interface Refs {
    chatContainer: Swish;
    inviteContainer: Swish;
}

export default class CustomLobby extends Module<Refs> {
    private doDispose = true;
    private room: ChatRoom;

    private invite: Invite.Panel;
    private inviting: boolean;

    public start = this.create<{}>();

    public constructor(provider: Invite.IProvider) {
        super(html);

        this.invite = new Invite.Panel(provider);
        this.invite.render(this.refs.inviteContainer);

        this.$('#start-game').on('click', (e: MouseEvent) => this.onStartGameClick(e));
        this.$('#quit-game').on('click', (e: MouseEvent) => this.onQuitGameClick(e));
        this.$('#switch-teams').on('click', (e: MouseEvent) => this.onSwitchTeamsClick(e));

        this.subscribe(Service.Custom.state, this.onState);
        this.subscribe(Service.Custom.champselect, this.onStart);
    }

    public dispose() {
        super.dispose();

        this.invite.dispose();

        if (this.doDispose)
            Service.abandon();
    }

    private onState(state: Domain.Game.CustomState) {
        if (!state.owner) return;

        var one = this.$('#team-one');
        var two = this.$('#team-two');
        one.empty();
        two.empty();

        if (!this.room && state.chatroom != guid.empty) {
            this.room = new ChatRoom(state.chatroom);
            this.refs.chatContainer.add(this.room.node);
        }

        for (var i = 0; i < state.blueTeam.length; i++) {
            this.drawMember(state.blueTeam[i], one);
        }

        for (var i = 0; i < state.redTeam.length; i++) {
            this.drawMember(state.redTeam[i], two);
        }

        if (!state.blueTeam.length) {
            let node = this.template('customlobbymember', {});
            node.addClass('blank');
            one.add(node)
        }

        if (!state.redTeam.length) {
            let node = this.template('customlobbymember', {});
            node.addClass('blank');
            two.add(node)
        }

        if (state.owner.id != state.me.id) {
            this.$('#start-game, #start-game-padd').css('display', 'none');
        } else {
            this.$('#start-game, #start-game-padd').css('display', null);
        }

        this.invite.update(state.isCaptain || state.canInvite, state.invitees);
    }

    private drawMember(member: Domain.Game.LobbyMember, team) {
        let node = this.template('customlobbymember', {
            id: member.id,
            name: member.name,
        });
        if (member.champ) {
            node.$('.icon').src = Assets.champion.icon(member.champ)
        } else {
            Summoner.get(member.name).then(s => {
                node.$('.icon').src = Assets.summoner.icon(s.icon)
            });
        }

        var old = this.$("#member-" + member.id);
        if (old.length > 0) {
            old.replace(node);
        } else {
            team.add(node);
        }
    }

    private onStart(game) {
        this.doDispose = false;
        this.dispatch(this.start, game);
    }

    private onSwitchTeamsClick(e: MouseEvent) {
        Service.Custom.switchTeams();
    }

    private onStartGameClick(e: MouseEvent) {
        Service.Custom.start();
    }

    private onQuitGameClick(e: MouseEvent) {
        Service.quit();
        this.doDispose = false;
        this.dispatch(this.closed, {});
    }
}