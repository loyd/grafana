package store

import (
	"context"

	"github.com/grafana/grafana-plugin-sdk-go/data"
)

const rootStorageTypeS3 = "s3"

type rootStorageS3 struct {
	baseStorageRuntime

	settings *StorageS3Config
}

func newS3Storage(prefix string, name string, cfg *StorageS3Config) *rootStorageS3 {
	if cfg == nil {
		cfg = &StorageS3Config{}
	}

	meta := RootStorageMeta{
		Config: RootStorageConfig{
			Type:   rootStorageTypeS3,
			Prefix: prefix,
			Name:   name,
			S3:     cfg,
		},
	}
	if prefix == "" {
		meta.Notice = append(meta.Notice, data.Notice{
			Severity: data.NoticeSeverityError,
			Text:     "Missing prefix",
		})
	}
	if cfg.Bucket == "" {
		meta.Notice = append(meta.Notice, data.Notice{
			Severity: data.NoticeSeverityError,
			Text:     "Missing bucket configuration",
		})
	}
	s := &rootStorageS3{}

	if meta.Notice == nil {
		meta.Notice = append(meta.Notice, data.Notice{
			Severity: data.NoticeSeverityError,
			Text:     "not impemented yet...",
		})
	}

	s.meta = meta
	s.settings = cfg
	return s
}

func (s *rootStorageS3) Write(ctx context.Context, cmd *WriteValueRequest) (*WriteValueResponse, error) {
	return &WriteValueResponse{
		Code:    500,
		Message: "unsupportted operation (S3)",
	}, nil
}