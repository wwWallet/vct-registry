export const typeMetadataSchema = {
  "type": "object",
  "properties": {
    "vct": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "extends": {
      "type": "string"
    },
    "extends#integrity": {
      "type": "string",
      "minLength": 1
    },
    "display": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "locale": {
            "type": "string",
            "minLength": 1
          },
          "name": {
            "type": "string",
            "minLength": 1
          },
          "description": {
            "type": "string"
          },
          "rendering": {
            "type": "object",
            "properties": {
              "simple": {
                "type": "object",
                "properties": {
                  "logo": {
                    "type": "object",
                    "properties": {
                      "uri": {
                        "type": "string",
                        "format": "uri"
                      },
                      "uri#integrity": {
                        "type": "string",
                        "minLength": 1
                      },
                      "alt_text": {
                        "type": "string"
                      }
                    },
                    "required": [
                      "uri"
                    ],
                    "additionalProperties": false
                  },
                  "background_image": {
                    "type": "object",
                    "properties": {
                      "uri": {
                        "type": "string",
                        "format": "uri"
                      },
                      "uri#integrity": {
                        "type": "string",
                        "minLength": 1
                      }
                    },
                    "required": [
                      "uri"
                    ],
                    "additionalProperties": false
                  },
                  "background_color": {
                    "type": "string"
                  },
                  "text_color": {
                    "type": "string"
                  }
                },
                "additionalProperties": false
              },
              "svg_templates": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "uri": {
                      "type": "string",
                      "format": "uri"
                    },
                    "uri#integrity": {
                      "type": "string",
                      "minLength": 1
                    },
                    "properties": {
                      "type": "object",
                      "properties": {
                        "orientation": {
                          "type": "string",
                          "enum": [
                            "portrait",
                            "landscape"
                          ]
                        },
                        "color_scheme": {
                          "type": "string",
                          "enum": [
                            "light",
                            "dark"
                          ]
                        },
                        "contrast": {
                          "type": "string",
                          "enum": [
                            "normal",
                            "high"
                          ]
                        }
                      },
                      "additionalProperties": false
                    }
                  },
                  "required": [
                    "uri"
                  ],
                  "additionalProperties": false
                }
              }
            },
            "additionalProperties": false
          }
        },
        "required": [
          "locale",
          "name"
        ],
        "additionalProperties": false
      }
    },
    "claims": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": {
            "minItems": 1,
            "type": "array",
            "items": {
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "type": "null"
                },
                {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 9007199254740991
                }
              ]
            }
          },
          "display": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "locale": {
                  "type": "string",
                  "minLength": 1
                },
                "label": {
                  "type": "string",
                  "minLength": 1
                },
                "description": {
                  "type": "string"
                }
              },
              "required": [
                "locale",
                "label"
              ],
              "additionalProperties": false
            }
          },
          "mandatory": {
            "type": "boolean"
          },
          "sd": {
            "type": "string",
            "enum": [
              "always",
              "allowed",
              "never"
            ]
          },
          "svg_id": {
            "type": "string",
            "pattern": "^[A-Za-z_][A-Za-z0-9_]*$"
          }
        },
        "required": [
          "path"
        ],
        "additionalProperties": false
      }
    },
    "vct#integrity": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "vct"
  ],
  "additionalProperties": false
};