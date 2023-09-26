#include <tree_sitter/parser.h>
#include <wctype.h>
#include <stdio.h>

enum TokenType {
  CONTENT,
  COMMENT
};

void *tree_sitter_twig_external_scanner_create() { return NULL; }
void tree_sitter_twig_external_scanner_destroy(void *p) {}
void tree_sitter_twig_external_scanner_reset(void *p) {}
unsigned tree_sitter_twig_external_scanner_serialize(void *p, char *buffer) { return 0; }
void tree_sitter_twig_external_scanner_deserialize(void *p, const char *b, unsigned n) {}

static void advance(TSLexer *lexer) { lexer->advance(lexer, false); }

bool tree_sitter_twig_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  // Eat whitespace
  while (iswspace(lexer->lookahead)) {
    lexer->advance(lexer, true);
  }

  // CONTENT
  bool has_content = false;

  while (lexer->lookahead) {
    if(lexer->lookahead == '{') {
      advance(lexer);

      if(lexer->lookahead == '{' ||
        lexer->lookahead == '%' ||
        lexer->lookahead == '#') {
        break;
      }
    } else {
      advance(lexer);
    }

    lexer->mark_end(lexer);
    has_content = true;
  }

  if (has_content) {
    lexer->result_symbol = CONTENT;
    return true;
  }

  // COMMENT
  if (lexer->lookahead == '#') {
    advance(lexer);

    while (lexer->lookahead) {
      lexer->mark_end(lexer);

      if(lexer->lookahead == '#') {
        advance(lexer);

        if(lexer->lookahead == '}') {
          lexer->result_symbol = COMMENT;
          advance(lexer);
          lexer->mark_end(lexer);
          return true;
        }
      }

      advance(lexer);
    }
  }

  return false;
}
