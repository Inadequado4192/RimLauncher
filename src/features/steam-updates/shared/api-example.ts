export type PublishedFile = PublishedFileOk | PublishedFileBad
export type PublishedFileOk = {
    publishedfileid: string,
    result: 1,
    creator: string, // ID
    creator_app_id: number,
    consumer_app_id: number,
    filename: string,
    file_size: string,
    file_url: string,
    hcontent_file: string,
    preview_url: string,
    hcontent_preview: string,
    title: string,
    description: string,
    time_created: number,
    time_updated: number,
    visibility: number,
    banned: number,
    ban_reason: string,
    subscriptions: number,
    favorited: number,
    lifetime_subscriptions: number,
    lifetime_favorited: number,
    views: number,
    // tags: [[Object], [Object]]
}
export type PublishedFileBad = {
    publishedfileid: string
    result: 9
}