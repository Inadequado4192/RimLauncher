import { injectable } from "tsyringe";
import { PublicPath, PublicPathsIpc } from "../shared";
import { handle, Initializable } from "#features/base/main";

@injectable()
export class PublicPathsRegistry implements Initializable {
    private paths: PublicPath[] = [];

    public initialize() {
        handle(PublicPathsIpc.Get, () => this.paths);
    }

    public registry(...publicPath: PublicPath[]) {
        publicPath.forEach(p => this.paths.push(p));
    }
}