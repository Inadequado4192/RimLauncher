export interface GitGudRequest_ApiExample_GitHub {
    "name": string,
    "commit": {
        "id": string,
        "short_id": string,
        "created_at": string[],
        "parent_ids": string[],
        "title": string,
        "message": string,
        "author_name": string,
        "author_email": string,
        "authored_date": string,
        "committer_name": string,
        "committer_email": string,
        "committed_date": string,
        "trailers": unknown,
        "extended_trailers": unknown,
        "web_url": string
    },
    "merged": boolean,
    "protected": boolean,
    "developers_can_push": boolean,
    "developers_can_merge": boolean,
    "can_push": boolean,
    "default": boolean,
    "web_url": string
}
