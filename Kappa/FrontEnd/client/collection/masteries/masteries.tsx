import Module        from './../../ui/module';
import Popup         from './../../uikit/popup';
import * as Tooltip  from './../../uikit/tooltip';
import * as Defer    from './../../../frontend/defer';
import * as Assets   from './../../../frontend/assets';

import { Masteries as Service } from './../../../backend/services';

const template = (
    <module class="masteries-page">
        <div class="left">
            <x-flexpadd/>
            <div id="mastery-page-list">
            </div>
            <div class="button-group">
                <button id="save-masteries">Save</button>
                <button id="revert-masteries">Revert</button>
            </div>
            <div class="button-group">
                <button id="reset-masteries">Reset</button>
                <button id="delete-masteries">Delete</button>
            </div>
            <x-flexpadd style="flex: 6"/>
        </div>
        <div class="body" data-ref="treeContainer">
        </div>
    </module>
);

const pageTemplate = (
    <div class="mastery-page">
        <span data-ref="name"/>
    </div>
);

const iconTemplate = (
    <div class="mastery-icon">
        <img data-ref="icon"/>
        <span class="mastery-icon-points"><span data-ref="current">0</span>/<span data-ref="max"/></span>
    </div>
);

let currentBook: Domain.Collection.MasteryBook;
let currentPage: Domain.Collection.MasteryPage;
let unedited: { [id: string]: number };

Defer.auth(() => {
    Service.get().then(book => currentBook = book);
});

export function selected() {
    return currentBook.selected;
}

export function list() {
    return currentBook.pages;
}

export function popup() {
    let popup = new MasteriesPopup();
    return popup;
}

export function select(page: Domain.Collection.MasteryPage) {
    currentBook.selected = page.id;

    Service.select(page);
}

interface Refs {
    treeContainer: Swish;
}

export class Page extends Module<Refs> {
    private icons: { [id: number]: any } = {};

    constructor() {
        super(template);

        this.$('#save-masteries').on('click', (e: MouseEvent) => this.onSaveMasteriesClick(e));
        this.$('#revert-masteries').on('click', (e: MouseEvent) => this.onRevertMasteriesClick(e));

        this.$('#reset-masteries').on('click', (e: MouseEvent) => this.onResetMasteriesClick(e));

        this.load();
    }

    private load() {
        if (!currentBook) {
            setTimeout(() => this.load(), 500);
            return;
        }
        for (var group of Assets.gamedata.masteries.tree.groups) {
            let node = this.createTree(group);
            // let node = React.template(<div class="mastery-tree"/>);
            this.refs.treeContainer.add(node);
            // this.createTree(group, node);
        }

        let active: Domain.Collection.MasteryPage;
        for (let i = 0; i < currentBook.pages.length; i++) {
            let page = currentBook.pages[i];
            if (page.id == currentBook.selected)
                active = page;
        }
        this.renderPage(active);
    }

    private renderPageList() {
        let list = this.$('#mastery-page-list');
        list.empty();
        for (let i = 0; i < currentBook.pages.length; i++) {
            let page = currentBook.pages[i];
            let node = Module.create(pageTemplate);
            node.refs.name.text = page.name;
            node.node.on('click', e => this.renderPage(page));
            node.render(list);
            node.node.setClass(page.id == currentBook.selected, 'active');
        }
    }

    private renderPage(page?: Domain.Collection.MasteryPage) {
        if (page) {
            select(page);
            currentPage = page;
            unedited = {};
            for (var id in currentPage.masteries)
                unedited[id] = currentPage.masteries[id];
        }

        this.renderPageList();

        for (var id in this.icons) {
            let icon = this.icons[id];
            icon.refs.current.text = '0';
        }

        for (var id in Assets.gamedata.masteries.data) {
            var info = Assets.gamedata.masteries.data[id];
            let icon = this.icons[info.id];

            let rank = currentPage.masteries[info.id] || 0;

            icon.node.setClass(rank != 0, 'active')
            if (rank == 0)
                delete currentPage.masteries[id];
            icon.refs.current.text = rank;
        }
    }

    private onMasteryChange(info: Domain.GameData.Mastery, tree: Domain.GameData.MasteryGroup, row: number, delta: number) {
        let changed = (currentPage.masteries[info.id] || 0) + delta;

        if (changed > info.maxRank || changed < 0)
            return;

        //Steal from other icons in row//
        let currentRow = getRowSum(tree.rows[row].masteries);
        currentRow += delta;

        //Steal from other icons in row//
        if (currentRow > tree.rows[row].maxPointsInRow) {
            let other = tree.rows[row].masteries.filter(n => n != info.id && !!currentPage.masteries[n]);
            currentPage.masteries[other[0]]--;
        }

        if (delta < 0) {
            //Check for masteries in higher rows//
            for (let y = row + 1; y < tree.rows.length; y++) {
                for (let x = 0; x < tree.rows[y].masteries.length; x++) {
                    if (currentPage.masteries[tree.rows[y].masteries[x]])
                        return;
                }
            }
        } else {
            //Check for masteries in lower rows//
            for (let y = 0; y < row; y++) {
                let above = getRowSum(tree.rows[y].masteries);
                if (above < tree.rows[y].maxPointsInRow) return;
            }

            //Check for mastery limit//
            let count = 0;
            for (let key in currentPage.masteries)
                count += currentPage.masteries[key];
            if (count >= 30) return;
        }

        currentPage.masteries[info.id] = changed;

        this.renderPage();
    }

    private onSaveMasteriesClick(e: MouseEvent) {
        Service.save(currentPage);
        this.renderPage(currentPage);
    }

    private onRevertMasteriesClick(e: MouseEvent) {
        currentPage.masteries = unedited;
        this.renderPage(currentPage);
    }

    private onResetMasteriesClick(e: MouseEvent) {
        currentPage.masteries = {};
        this.renderPage();
    }

    private createTree(src: Domain.GameData.MasteryGroup) {
        let dst = React.template(<div class="mastery-tree"/>);

        for (let y = 0; y < src.rows.length; y++) {
            let row = React.template(<div class="mastery-row" class-single={ src.rows[y].maxPointsInRow == 1 }/>)
            for (let id of src.rows[y].masteries) {
                let info = Assets.gamedata.masteries.data[id];
                let icon = Module.create(iconTemplate);
                icon.refs.icon.src = Assets.masteries.icon(info.id);
                icon.refs.max.text = info.maxRank;

                icon.node.setClass(info.maxRank == 1, 'single');

                icon.render(row);
                icon.node.on('wheel', (e: WheelEvent) => this.onMasteryChange(info, src, y, -e.deltaY / Math.abs(e.deltaY)));

                Tooltip.top(icon.node, new MasteryTooltip(info));

                this.icons[info.id] = icon;
            }

            dst.add(row);
        }

        return dst;
    }
}

function getRowSum(row: number[]) {
    var sum = 0;
    for (var id of row) {
        sum += currentPage.masteries[id] || 0;
    }
    return sum;
}

class MasteriesPopup extends Popup<Page> {
    constructor() {
        super("Masteries", new Page());
    }
}

const tooltipTemplate = (
    <module class="masteries-tooltip">
        <span class="title" data-ref="title"/>
        <span class="description" data-ref="description"/>
    </module>
);

interface Refs {
    title: Swish;
    description: Swish;
}

class MasteryTooltip extends Tooltip.Content<Refs> {
    private info: Domain.GameData.Mastery;

    constructor(info: Domain.GameData.Mastery) {
        super(tooltipTemplate);

        this.info = info;

        this.refs.title.text = info.name;
    }

    public onshow() {
        let rank = currentPage.masteries[this.info.id] || 0;
        this.refs.description.html = this.info.description[Math.max(rank - 1, 0)];
    }
}