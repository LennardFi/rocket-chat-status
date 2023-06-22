// import ChannelHost from "../lib/ChannelHost"
// import { buildError } from "../lib/tools"
// import { ApiProvider } from "./ApiProvider"
// import { ConfigProvider } from "./ConfigProvider"
// import { Provider } from "./Provider"

// export class StateProvider extends Provider {
//     private statusChannel: ChannelHost<RCS.Base.Status>
//     private apiStatusConnection?: RCS.Channel.Channel<RCS.Base.Status>
//     private canAccessApiConnection?: RCS.Channel.Channel<boolean>

//     constructor() {
//         super()
//         this.statusChannel = new ChannelHost<RCS.Base.Status>(
//             {
//                 availability: "hidden",
//                 connected: false,
//                 message: "",
//             },
//             async (e) => {
//                 if (e.cause === "subscriber") {
//                     if (this.apiStatusConnection === undefined) {
//                         throw buildError(
//                             "internal",
//                             "ChannelHostConnectionLost"
//                         )
//                     }
//                     const newApiStatus = await this.apiStatusConnection.propose(
//                         e.next
//                     )
//                     return newApiStatus
//                 }
//                 return e.next
//             }
//         )
//     }

//     async addProviderDependency(provider: ApiProvider): Promise<void>
//     async addProviderDependency(provider: ConfigProvider): Promise<void>
//     async addProviderDependency(
//         provider: ApiProvider | ConfigProvider
//     ): Promise<void> {
//         if (provider instanceof ApiProvider) {
//             this.apiStatusConnection = provider.status(
//                 undefined,
//                 undefined,
//                 () => {
//                     this.apiStatusConnection = undefined
//                 }
//             )
//             this.canAccessApiConnection = provider.canAccessApi()
//         }
//     }

//     status(
//         onChangeHandler?: RCS.Channel.ChangeHandler<RCS.Base.Status>,
//         onRejectHandler?: RCS.Channel.RejectHandler<RCS.Base.Status>,
//         onRevokeHandler?: RCS.Channel.RevokeHandler<RCS.Base.Status>
//     ): RCS.Channel.Channel<RCS.Base.Status> {
//         return this.statusChannel.createChannel(
//             onChangeHandler,
//             onRejectHandler,
//             onRevokeHandler
//         )
//     }

//     dispose(): void {
//         this.statusChannel.dispose()
//         this.apiStatusConnection?.dispose()
//     }
// }
