import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { uniqBy } from 'lodash';

// Types
import { RichHistoryQuery, ExploreId } from 'app/types/explore';

// Utils
import { stylesFactory, useTheme, Select, MultiSelect, FilterInput } from '@grafana/ui';
import { GrafanaTheme, SelectableValue } from '@grafana/data';
import { filterAndSortQueries, createDatasourcesList, SortOrder } from 'app/core/utils/richHistory';

// Components
import RichHistoryCard from './RichHistoryCard';
import { sortOrderOptions } from './RichHistory';
import { useDebounce } from 'react-use';

export interface Props {
  queries: RichHistoryQuery[];
  sortOrder: SortOrder;
  activeDatasourceOnly: boolean;
  datasourceFilters: SelectableValue[];
  exploreId: ExploreId;
  onChangeSortOrder: (sortOrder: SortOrder) => void;
  onSelectDatasourceFilters: (value: SelectableValue[]) => void;
}

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  const bgColor = theme.isLight ? theme.palette.gray5 : theme.palette.dark4;
  return {
    container: css`
      display: flex;
    `,
    containerContent: css`
      width: 100%;
    `,
    selectors: css`
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
    `,
    multiselect: css`
      width: 100%;
      margin-bottom: ${theme.spacing.sm};
      .gf-form-select-box__multi-value {
        background-color: ${bgColor};
        padding: ${theme.spacing.xxs} ${theme.spacing.xs} ${theme.spacing.xxs} ${theme.spacing.sm};
        border-radius: ${theme.border.radius.sm};
      }
    `,
    filterInput: css`
      margin-bottom: ${theme.spacing.sm};
    `,
    sort: css`
      width: 170px;
    `,
    footer: css`
      height: 60px;
      margin-top: ${theme.spacing.lg};
      display: flex;
      justify-content: center;
      font-weight: ${theme.typography.weight.light};
      font-size: ${theme.typography.size.sm};
      a {
        font-weight: ${theme.typography.weight.semibold};
        margin-left: ${theme.spacing.xxs};
      }
    `,
  };
});

export function RichHistoryStarredTab(props: Props) {
  const {
    datasourceFilters,
    onSelectDatasourceFilters,
    queries,
    onChangeSortOrder,
    sortOrder,
    activeDatasourceOnly,
    exploreId,
  } = props;

  const [data, setData] = useState<[RichHistoryQuery[], ReturnType<typeof createDatasourcesList>]>([[], []]);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearchInput, setDebouncedSearchInput] = useState('');

  const theme = useTheme();
  const styles = getStyles(theme);

  useDebounce(
    () => {
      setDebouncedSearchInput(searchInput);
    },
    300,
    [searchInput]
  );

  useEffect(() => {
    const datasourcesRetrievedFromQueryHistory = uniqBy(queries, 'datasourceName').map((d) => d.datasourceName);
    const listOfDatasources = createDatasourcesList(datasourcesRetrievedFromQueryHistory);
    const starredQueries = queries.filter((q) => q.starred === true);
    setData([
      filterAndSortQueries(
        starredQueries,
        sortOrder,
        datasourceFilters.map((d) => d.value),
        debouncedSearchInput
      ),
      listOfDatasources,
    ]);
  }, [queries, sortOrder, datasourceFilters, debouncedSearchInput]);

  const [filteredQueries, listOfDatasources] = data;

  return (
    <div className={styles.container}>
      <div className={styles.containerContent}>
        <div className={styles.selectors}>
          {!activeDatasourceOnly && (
            <MultiSelect
              className={styles.multiselect}
              menuShouldPortal
              options={listOfDatasources}
              value={datasourceFilters}
              placeholder="Filter queries for data sources(s)"
              aria-label="Filter queries for data sources(s)"
              onChange={onSelectDatasourceFilters}
            />
          )}
          <div className={styles.filterInput}>
            <FilterInput
              placeholder="Search queries"
              value={searchInput}
              onChange={(value: string) => {
                setSearchInput(value);
              }}
            />
          </div>
          <div aria-label="Sort queries" className={styles.sort}>
            <Select
              menuShouldPortal
              options={sortOrderOptions}
              value={sortOrderOptions.filter((order) => order.value === sortOrder)}
              placeholder="Sort queries by"
              onChange={(e) => onChangeSortOrder(e.value as SortOrder)}
            />
          </div>
        </div>
        {filteredQueries.map((q) => {
          const idx = listOfDatasources.findIndex((d) => d.label === q.datasourceName);
          return (
            <RichHistoryCard
              query={q}
              key={q.id}
              exploreId={exploreId}
              dsImg={listOfDatasources[idx].imgUrl}
              isRemoved={listOfDatasources[idx].isRemoved}
            />
          );
        })}
        <div className={styles.footer}>The history is local to your browser and is not shared with others.</div>
      </div>
    </div>
  );
}
