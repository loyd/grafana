import React, { useEffect, useState } from 'react';
import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarResults,
  KBarSearch,
  useMatches,
  Action,
  VisualState,
  useRegisterActions,
  useKBar,
} from 'kbar';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { ResultItem } from './ResultItem';
import getGlobalActions from './actions/global.static.actions';
import getDashboardNavActions from './actions/dashboard.nav.actions';
import { useSelector } from 'react-redux';
import { StoreState } from 'app/types';
import { css } from '@emotion/css';
import { keybindingSrv } from '../../core/services/keybindingSrv';
import { reportInteraction, locationService } from '@grafana/runtime';

/**
 * Wrap all the components from KBar here.
 * @constructor
 */

export const CommandPalette = () => {
  const styles = useStyles2(getSearchStyles);
  const [actions, setActions] = useState<Action[]>([]);
  const { notHidden, query, showing } = useKBar((state) => ({
    notHidden: state.visualState !== VisualState.hidden,
    showing: state.visualState === VisualState.showing,
  }));
  const isNotLogin = locationService.getLocation().pathname !== '/login';

  const { navBarTree } = useSelector((state: StoreState) => {
    return {
      navBarTree: state.navBarTree,
    };
  });

  keybindingSrv.bind('esc', () => {
    if (notHidden) {
      query.setVisualState(VisualState.animatingOut);
    }
  });

  useEffect(() => {
    (async () => {
      if (isNotLogin) {
        const staticActions = getGlobalActions(navBarTree);
        const dashAct = await getDashboardNavActions('go/dashboard');
        setActions([...staticActions, ...dashAct]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNotLogin]);

  useEffect(() => {
    if (showing) {
      reportInteraction('commandPalette_opened');
    }
  }, [showing]);

  useRegisterActions(actions, [actions]);

  return actions.length > 0 ? (
    <KBarPortal>
      <KBarPositioner className={styles.positioner}>
        <KBarAnimator className={styles.animator}>
          <KBarSearch className={styles.search} />
          <RenderResults />
        </KBarAnimator>
      </KBarPositioner>
    </KBarPortal>
  ) : null;
};

const RenderResults = () => {
  const { results, rootActionId } = useMatches();
  const styles = useStyles2(getSearchStyles);

  return (
    <div className={styles.resultsContainer}>
      <KBarResults
        items={results}
        onRender={({ item, active }) =>
          typeof item === 'string' ? (
            <div className={styles.sectionHeader}>{item}</div>
          ) : (
            <ResultItem action={item} active={active} currentRootActionId={rootActionId!} />
          )
        }
      />
    </div>
  );
};

const getSearchStyles = (theme: GrafanaTheme2) => ({
  positioner: css({
    zIndex: theme.zIndex.portal,
    marginTop: '0px',
    '&::before': {
      content: '""',
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      background: theme.components.overlay.background,
      backdropFilter: 'blur(1px)',
    },
  }),
  animator: css({
    maxWidth: theme.breakpoints.values.sm, // supposed to be 600...
    width: '100%',
    background: theme.colors.background.canvas,
    color: theme.colors.text.primary,
    borderRadius: theme.shape.borderRadius(4),
    overflow: 'hidden',
    boxShadow: theme.shadows.z3,
  }),
  search: css({
    padding: theme.spacing(2, 3),
    fontSize: theme.typography.fontSize,
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    border: 'none',
    background: theme.colors.background.canvas,
    color: theme.colors.text.primary,
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
  sectionHeader: css({
    padding: theme.spacing(1, 2),
    fontSize: theme.typography.h6.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    color: theme.colors.text.secondary,
  }),
  resultsContainer: css({
    padding: theme.spacing(2, 0),
  }),
});
