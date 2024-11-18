{
  "targets": [
    {
      "target_name": "tree_sitter_twig_binding",
      "include_dirs": [
        "<!(node -p \"require('node-addon-api').include_dir\")",
        "src"
      ],
      "sources": [
        "bindings/node/binding.cc",
        "src/parser.c",
        "src/scanner.c",
      ],
      "cflags_c": [
        "-std=c99",
      ],
      'conditions': [
        ['OS=="win"', {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 0,
              "AdditionalOptions": ["/EHsc"]
            }
          },
          "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
        }]
      ]
    }
  ]
}
