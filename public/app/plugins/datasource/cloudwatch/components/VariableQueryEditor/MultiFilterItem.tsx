import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { AccessoryButton, InputGroup } from '@grafana/experimental';
import { Input, stylesFactory, useTheme2 } from '@grafana/ui';
import React, { FunctionComponent, useState } from 'react';
import { MultiFilterCondition } from './MultiFilter';

export interface Props {
  filter: MultiFilterCondition;
  onChange: (value: MultiFilterCondition) => void;
  onDelete: () => void;
}

export const MultiFilterItem: FunctionComponent<Props> = ({ filter, onChange, onDelete }) => {
  const [localKey, setLocalKey] = useState(filter.key || '');
  const [localValue, setLocalValue] = useState(filter.value?.join(', ') || '');
  const theme = useTheme2();
  const styles = getOperatorStyles(theme);

  return (
    <div data-testid="cloudwatch-multifilter-item">
      <InputGroup>
        <Input
          data-testid="cloudwatch-multifilter-item-key"
          aria-label="Filter key"
          value={localKey}
          placeholder="key"
          onChange={(e) => setLocalKey(e.currentTarget.value)}
          onBlur={() => {
            if (localKey && localKey !== filter.key) {
              onChange({ key: localKey, value: undefined });
            }
          }}
        />

        <span className={cx(styles.root)}>=</span>

        <Input
          data-testid="cloudwatch-multifilter-item-value"
          aria-label="Filter value"
          value={localValue}
          placeholder="value1, value2,..."
          onChange={(e) => setLocalValue(e.currentTarget.value)}
          onBlur={() => {
            const newValues = localValue.replace(' ', '').split(',');
            if (localValue && newValues !== filter.value) {
              onChange({ ...filter, value: newValues });
            }
          }}
        />

        <AccessoryButton aria-label="remove" icon="times" variant="secondary" onClick={onDelete} type="button" />
      </InputGroup>
    </div>
  );
};

const getOperatorStyles = stylesFactory((theme: GrafanaTheme2) => ({
  root: css({
    padding: theme.spacing(0, 1),
    alignSelf: 'center',
  }),
}));
