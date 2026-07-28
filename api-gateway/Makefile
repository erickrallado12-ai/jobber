.PHONY: generate run install

PROTO_DIR  := ../proto
PROTO_FILE := $(PROTO_DIR)/resume.proto
GEN_DIR    := generated

install:
	pip install -r requirements.txt

generate:
	python -m grpc_tools.protoc \
		-I$(PROTO_DIR) \
		--python_out=$(GEN_DIR) \
		--grpc_python_out=$(GEN_DIR) \
		$(PROTO_FILE)
	@echo "touch" > $(GEN_DIR)/__init__.py

run: generate
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
