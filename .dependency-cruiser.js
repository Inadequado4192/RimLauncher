/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
    forbidden: [
        {
            name: "no-circular",
            severity: "warn",
            from: {},
            to: {
                circular: true,
            },
        },
    ],
    options: {
        doNotFollow: {
            path: ['node_modules']
        },
        exclude: {
            path: "^node_modules",
        },

        tsPreCompilationDeps: true,

        tsConfig: {
            fileName: 'tsconfig.json'
        },

        enhancedResolveOptions: {
            exportsFields: ['exports'],

            conditionNames: ['import', 'require', 'node', 'default', 'types'],

            mainFields: ["main", "types", "typings"],

        },
        skipAnalysisNotInRules: true,

        reporterOptions: {
            dot: {
                collapsePattern: 'node_modules/(?:@[^/]+/[^/]+|[^/]+)',
            },
            archi: {
                collapsePattern: "^src/features/[^/]+",
                theme: {
                    graph: {
                        bgcolor: "#121212",
                        fillcolor: "#242424",
                        color: "#444444",
                        fontcolor: "#E0E0E0",
                        splines: "ortho",
                    },
                    node: {
                        color: "#555555",
                        fillcolor: "#242424",
                        fontcolor: "#E0E0E0",
                        style: "filled",
                    },
                    edge: {
                        color: "#888888",
                        fontcolor: "#BBBBBB",
                        penwidth: 0.7,
                        arrowsize: 0.5,
                    },
                    dependencies: [
                        {
                            criteria: {
                                dependencyTypes: ["core"],
                            },
                            attributes: {
                                color: "#88888855",
                                fontcolor: "#88888855",
                            },
                        },
                    ],
                    modules: [
                        {
                            criteria: {
                                coreModule: true,
                            },
                            attributes: {
                                color: "#555555",
                                fillcolor: "#24242433",
                                fontcolor: "#888888",
                            },
                        },
                    ],
                },
            },
            text: {
                highlightFocused: true
            },
        }
    }
};