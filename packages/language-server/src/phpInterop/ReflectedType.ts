export type ReflectedType = {
    properties: {
        name: string;
        type: string;
    }[];
    methods: {
        name: string;
        returnType: string;
        parameters: {
            name: string;
            type: string;
            isOptional: boolean;
            isVariadic: boolean;
        }[];
    }[];
};
