type Property = {
    name: string;
    type: string;
};

type MethodParam = {
    name: string;
    type: string;
    isOptional: boolean;
    isVariadic: boolean;
};

type Method = {
    name: string;
    type: string;
    parameters: MethodParam[];
};

export type ReflectedType = {
    properties: Property[];
    methods: Method[];
};
