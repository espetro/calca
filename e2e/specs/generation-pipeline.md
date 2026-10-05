# Generation Pipeline

## Malformed prompt fails gracefully

* Open "/"
* Fill "a single unclosed tag or malformed CSS" in the "Prompt" field
* Press the "Enter" key
* Page should not contain "500 Internal Server Error"
* Page should not contain "Unexpected token"
