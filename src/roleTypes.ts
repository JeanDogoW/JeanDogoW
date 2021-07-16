export enum Action {
    CreateOwn = "createOwn",
    CreateAny = "createAny",
    ReadAny = "readAny",
    UpdateAny = "updateAny",
    UpdateOwn = "updateOwn"
}

export enum Resource {
    Data = "data"
}

export interface IScope {
    action: Action,
    resource: Resource
}