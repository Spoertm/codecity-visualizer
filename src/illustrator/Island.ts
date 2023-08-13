import { Illustrator } from "./Illustrator";
import { Container, SpecificContainer } from "./container/Container";
import { DistrictContainerOptions } from "./container/specific/Districts";
import { Point } from "../components/Point";
import { Illustration } from "./components/Illustration";
import { Shape, House } from "./components/Shapes";
import { PlatformContainer } from "./container/universal/Platform";
import { IslandContainer } from "./container/specific/IslandContainer";
import { TreeNode } from "../components/TreeNode";

export interface IslandOptions extends AttributeContainer {
    "layout.tower"?: boolean;
    "house.length"?: number;
    "house.width"?: number;
    "house.height"?: number;
    "house.margin"?: number;
    "house.color"?: number;
    "platform.height"?: number;
    "platform.color"?: number;
    "island.container"?: SpecificContainer;
    "island.options"?: DistrictContainerOptions;
}

/**
 * Create an Island Layout City
 */
export class Island extends Illustrator {
    private _model: SoftwareModel;

    constructor(model: SoftwareModel, options: IslandOptions = {}) {
        super();

        this.setOptions(options);
        this.setDefaults({
            "layout.tower": true,

            "house.length": 12,
            "house.width": 12,
            "house.height": 12,
            "house.margin": 3,
            "house.color": 0x1A212E,

            "street.color": 0x004cc7,

            "platform.height": 10,
            "platform.color": 0xFF0000,

            "island.container": IslandContainer,
            "island.options": {}
        });

        this._model = model;
    }

    public draw(version: VersionInterface): Illustration {
        const srcNode = this._model.getTree().find("lucene-solr:src/java/org/apache/lucene") as TreeNodeInterface;
        const islandModels = this.createIslandModels(srcNode, version);

        var pos = new Point(0, 0, 0);
        const rotation = 0;
        const columns = 3;
        const margin = 1200;

        for (let i = 0; i < islandModels.length; i++) {
            const island = islandModels[i];
            island.draw(pos, rotation);
            pos.x += margin;

            if (i % columns === 0) {
                pos.x = 0;
                pos.y -= margin;
            }
        }

        const illustration = new Illustration(version);
        for (const island of islandModels) {
            for (const shape of island.getSpatialInformation()) {
                illustration.addShape(shape);
            }
        }

        return illustration;
    }

    private createIslandModels(tree: TreeNodeInterface, version: VersionInterface): Shape[] {
        const islands: Shape[] = [];

        for (const childNode of tree.children) {
            let childName = (childNode as TreeNode).toString();
            if (childName.includes(".") || childName.includes("messages"))
                continue;

            if (childName.includes("util")) {
                const messagesNode = tree.find("lucene-solr:src/java/org/apache/lucene/messages") as TreeNodeInterface;
                const messagesModel = this.createSpatialModel(messagesNode, version);
                const utilModel = this.createSpatialModel(childNode, version) as Container;
                utilModel.add(messagesModel);
                islands.push(utilModel);
                continue;
            }

            islands.push(this.createSpatialModel(childNode, version));
        }

        return islands;
    }

    private createSpatialModel(tree: TreeNodeInterface, version: VersionInterface): Shape {
        if (!tree.children.length) {
            return this.createHouse(tree, version);
        }

        var preventTower = !this.getOption("layout.tower") &&
            tree.children.length === 1 &&
            tree.children[0].children.length > 0;

        if (preventTower) {
            return this.createSpatialModel(tree.children[0], version);
        }

        const container = this.createContainer(tree, version);

        for (const child of tree.children) {
            if (this._model.exists(child, version)) {
                container.add(this.createSpatialModel(child, version));
            }
        }

        return container;
    }

    private createContainer(node: TreeNodeInterface, version: VersionInterface): SpecificContainer {
        const containerClass = this.getOption("island.container");

        const containerOptions: DistrictContainerOptions = Object.assign({}, this.getOption("island.options"));

        const platformOptions = this.applyRules(this._model, node, version);

        // TODO: Fix this!
        let oldFunc: (s: string, m: boolean) => PlatformContainer;
        if (containerOptions["platform.container"] !== undefined) {
            oldFunc = containerOptions["platform.container"] as (s: string, m: boolean) => PlatformContainer;
        } else {
            oldFunc = (s: string, m: boolean) => new PlatformContainer(s, m);
        }

        containerOptions["platform.container"] = (s: string, m: boolean) => {
            const o = oldFunc(s, m);
            for (const key in platformOptions) {
                if (platformOptions.hasOwnProperty(key)) {
                    o.setOption(key, platformOptions[key]);
                }
            }
            return o;
        };

        return new containerClass(String(node), containerOptions);
    }

    private createHouse(node: TreeNodeInterface, version: VersionInterface): House {
        const defaultLayout = {
            "dimensions.length": this.getOption("house.length"),
            "dimensions.width": this.getOption("house.width"),
            "dimensions.height": this.getOption("house.height"),
            "margin": this.getOption("house.margin"),
            "color": this.getOption("house.color")
        };

        const house = new House(String(node));
        house.updateAttributes(Object.assign(defaultLayout, this.applyRules(this._model, node, version)));

        return house;
    }
}
