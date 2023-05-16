import { Ferry } from "../../components/Shapes";
import { UniversalContainer } from "../Container";

/**
 * Lines Elements one after the other, centered on
 * the y axis (mirroring has no effect)
 */
export class ConnectionContainer extends UniversalContainer {
    private connections: Ferry[];

    constructor(key: string, mirror: boolean = false) {
        super(key, mirror);

        this.connections = [];
    }

    public add(ferry: Ferry) {
        this.connections.push(ferry);
        super.add(ferry);
    }

    public finalize() {
    }
}