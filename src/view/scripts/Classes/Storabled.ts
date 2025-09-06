import { Store } from "../Stores/store";

export default abstract class Storabled {
    public abstract store: Store<any>;
}