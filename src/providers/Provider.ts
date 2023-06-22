export abstract class Provider {
    abstract addProviderDependency(provider: Provider): Promise<void>
    abstract dispose(): void
}
