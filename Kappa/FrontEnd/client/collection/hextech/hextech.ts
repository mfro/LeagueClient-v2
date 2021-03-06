import Module         from './../../ui/module';
import * as Assets    from './../../../frontend/assets';

import { Hextech as Service } from './../../../backend/services';

const html = Module.import('collection/hextech');

interface Refs {
    chests: Swish;
    keys: Swish;
    keyfragments: Swish;
    blue: Swish;
    orange: Swish;
    lootList: Swish;
}

export default class HextechPage extends Module<Refs> {
    private inventory: Domain.Collection.HextechInventory;

    public constructor() {
        super(html);

        Service.inventory().then(inv => this.update(inv));
        this.subscribe(Service.update, inv => this.update(inv));
    }

    private update(update: Domain.Collection.HextechInventory) {
        this.inventory = update;

        this.draw();
    }

    private draw() {
        this.refs.chests.text = this.inventory.chests;
        this.refs.keys.text = this.inventory.keys;
        this.refs.keyfragments.text = this.inventory.keyFragments

        this.refs.blue.text = this.inventory.blueEssence;
        this.refs.orange.text = this.inventory.orangeEssence;

        this.refs.lootList.empty();

        let group, list;

        group = this.template('loot-group', { groupname: 'Champion Loot' });
        list = group.$('.loot-group-body');

        for (let raw in this.inventory.champs) {
            let id = parseInt(raw);
            let node = this.template('loot-champ', {
                iconurl: Assets.champion.icon(id),
                count: this.inventory.champs[id],
                type: 'permanent'
            });
            list.add(node);
        }

        for (let raw in this.inventory.champShards) {
            let id = parseInt(raw);
            let node = this.template('loot-champ', {
                iconurl: Assets.champion.icon(id),
                count: this.inventory.champShards[id],
                type: 'shard'
            });
            list.add(node);
        }

        this.refs.lootList.add(group);

        group = this.template('loot-group', { groupname: 'Skins Loot' });
        list = group.$('.loot-group-body');

        for (let raw in this.inventory.skins) {
            let id = parseInt(raw);
            let node = this.template('loot-skin', {
                iconurl: Assets.champion.splash(id / 1000, id % 1000),
                count: this.inventory.skins[raw],
                type: 'permanent'
            });
            list.add(node);
        }

        for (let raw in this.inventory.skinShards) {
            let id = parseInt(raw);
            let node = this.template('loot-skin', {
                iconurl: Assets.champion.splash(id / 1000, id % 1000),
                count: this.inventory.skinShards[raw],
                type: 'shard'
            });
            list.add(node);
        }

        this.refs.lootList.add(group);
    }
}
