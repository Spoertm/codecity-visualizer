import { Illustrator } from "./Illustrator";
import { Container, SpecificContainer, UniversalContainer } from "./container/Container";
import { DistrictContainerOptions } from "./container/specific/Districts";
import { Point } from "../components/Point";
import { Illustration } from "./components/Illustration";
import { Shape, House, Street, Ferry } from "./components/Shapes";
import { PlatformContainer } from "./container/universal/Platform";
import { IslandContainer } from "./container/specific/IslandContainer";
import { Lightmap } from "./container/universal/Lightmap";
import { ConnectionContainer } from "./container/specific/ConnectionContainer";
import { Version } from "../components/Version";

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
        const islandModel: Container = this.createIslandsContainer(this._model.getTree(), version);

        var origin = new Point(0, 0, 0);
        const rotation = 0;

        islandModel.draw(origin, rotation);

        let roadsContainer = this.handleRoads(islandModel, version);
        roadsContainer.draw(origin, rotation);

        const illustration = new Illustration(version);
        for (const shape of islandModel.getSpatialInformation()) {
            illustration.addShape(shape);
        }

        for (const shape of roadsContainer.getSpatialInformation()) {
            illustration.addShape(shape);
        }

        return illustration;
    }

    private createIslandsContainer(tree: TreeNodeInterface, version: VersionInterface): Container {
        let lightmap = new Lightmap(String(this._model.getTree()));

        for (const childNode of tree.children) {
            lightmap.add(this.createSpatialModel(childNode, version));
        }

        return lightmap;
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

    private handleRoads(islandModel: Container, version: VersionInterface): ConnectionContainer {
        let roadContainer = new ConnectionContainer("CC");

        let houses: House[] = this.findHouses(islandModel.shapes);

        let firstHouse = houses.filter(s => s.key.includes("EmbedHelper.cs"))[0];
        let secondHouse = houses.filter(s => s.key.includes("SplitsModule.cs"))[0];

        let newferry = this.createFerry(
            "House1-House2",
            firstHouse,
            secondHouse,
            version);

        roadContainer.add(newferry);
        roadContainer.finalize();

        return roadContainer;
    }

    private findHouses(shapes: Shape[]): House[] {
        const houses: House[] = [];

        for (const shape of shapes) {
            if (shape instanceof House) {
                houses.push(shape);
            }

            if (shape instanceof Container) {
                const childHouses = this.findHouses(shape.shapes);
                houses.push(...childHouses);
            }
        }

        return houses;
    }

    private createFerry(
        key: string,
        start: House,
        end: House,
        version: VersionInterface
    ): Ferry {
        const defaultLayout = {
            "color": this.getOption("street.color")
        };

        const street = new Ferry(key, start, end);
        street.updateAttributes(defaultLayout);

        return street;
    }
}
