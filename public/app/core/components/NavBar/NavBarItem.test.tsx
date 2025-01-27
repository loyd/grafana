import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { locationUtil } from '@grafana/data';
import { config, setLocationService } from '@grafana/runtime';
import TestProvider from '../../../../test/helpers/TestProvider';

// Need to mock createBrowserHistory here to avoid errors
jest.mock('history', () => ({
  ...jest.requireActual('history'),
  createBrowserHistory: () => ({
    listen: jest.fn(),
    location: {},
    createHref: jest.fn(),
  }),
}));

import NavBarItem, { Props } from './NavBarItem';

const onClickMock = jest.fn();
const defaults: Props = {
  children: undefined,
  link: {
    text: 'Parent Node',
    onClick: onClickMock,
    children: [
      { text: 'Child Node 1', onClick: onClickMock, children: [] },
      { text: 'Child Node 2', onClick: onClickMock, children: [] },
    ],
  },
};

async function getTestContext(overrides: Partial<Props> = {}, subUrl = '') {
  jest.clearAllMocks();
  config.appSubUrl = subUrl;
  locationUtil.initialize({ config, getTimeRangeForUrl: jest.fn(), getVariablesUrlParams: jest.fn() });
  const pushMock = jest.fn();
  const locationService: any = { push: pushMock };
  setLocationService(locationService);
  const props = { ...defaults, ...overrides };

  const { rerender } = render(
    <TestProvider>
      <BrowserRouter>
        <NavBarItem {...props}>{props.children}</NavBarItem>
      </BrowserRouter>
    </TestProvider>
  );

  // Need to click this first to set the correct selection range
  // see https://github.com/testing-library/user-event/issues/901#issuecomment-1087192424
  await userEvent.click(document.body);
  return { rerender, pushMock };
}

describe('NavBarItem', () => {
  describe('when url property is not set', () => {
    it('then it renders the menu trigger as a button', async () => {
      await getTestContext();

      expect(screen.getAllByRole('button')).toHaveLength(1);
    });

    describe('and clicking on the menu trigger button', () => {
      it('then the onClick handler should be called', async () => {
        await getTestContext();

        await userEvent.click(screen.getByRole('button'));
        expect(onClickMock).toHaveBeenCalledTimes(1);
      });
    });

    describe('and hovering over the menu trigger button', () => {
      it('then the menu items should be visible', async () => {
        await getTestContext();

        await userEvent.hover(screen.getByRole('button'));

        expect(screen.getByRole('menuitem', { name: 'Parent Node' })).toBeInTheDocument();
        expect(screen.getByText('Child Node 1')).toBeInTheDocument();
        expect(screen.getByText('Child Node 2')).toBeInTheDocument();
      });
    });

    describe('and tabbing to the menu trigger button', () => {
      it('then the menu items should be visible', async () => {
        await getTestContext();

        await userEvent.tab();

        expect(screen.getByText('Parent Node')).toBeInTheDocument();
        expect(screen.getByText('Child Node 1')).toBeInTheDocument();
        expect(screen.getByText('Child Node 2')).toBeInTheDocument();
      });
    });

    describe('and pressing arrow right on the menu trigger button', () => {
      it('then the correct menu item should receive focus', async () => {
        await getTestContext();

        await userEvent.tab();
        expect(screen.getAllByRole('menuitem')).toHaveLength(3);
        expect(screen.getByRole('menuitem', { name: 'Parent Node' })).toHaveAttribute('tabIndex', '-1');
        expect(screen.getAllByRole('menuitem')[1]).toHaveAttribute('tabIndex', '-1');
        expect(screen.getAllByRole('menuitem')[2]).toHaveAttribute('tabIndex', '-1');

        await userEvent.keyboard('{ArrowRight}');
        expect(screen.getAllByRole('menuitem')).toHaveLength(3);
        expect(screen.getAllByRole('menuitem')[0]).toHaveAttribute('tabIndex', '0');
        expect(screen.getAllByRole('menuitem')[1]).toHaveAttribute('tabIndex', '-1');
        expect(screen.getAllByRole('menuitem')[2]).toHaveAttribute('tabIndex', '-1');
      });
    });
  });

  describe('when url property is set', () => {
    it('then it renders the menu trigger as a link', async () => {
      await getTestContext({ link: { ...defaults.link, url: 'https://www.grafana.com' } });

      expect(screen.getAllByRole('link')).toHaveLength(1);
      expect(screen.getByRole('link')).toHaveAttribute('href', 'https://www.grafana.com');
    });

    describe('and hovering over the menu trigger link', () => {
      it('then the menu items should be visible', async () => {
        await getTestContext({ link: { ...defaults.link, url: 'https://www.grafana.com' } });

        await userEvent.hover(screen.getByRole('link'));

        expect(screen.getByText('Parent Node')).toBeInTheDocument();
        expect(screen.getByText('Child Node 1')).toBeInTheDocument();
        expect(screen.getByText('Child Node 2')).toBeInTheDocument();
      });
    });

    describe('and tabbing to the menu trigger link', () => {
      it('then the menu items should be visible', async () => {
        await getTestContext({ link: { ...defaults.link, url: 'https://www.grafana.com' } });

        await userEvent.tab();

        expect(screen.getByText('Parent Node')).toBeInTheDocument();
        expect(screen.getByText('Child Node 1')).toBeInTheDocument();
        expect(screen.getByText('Child Node 2')).toBeInTheDocument();
      });
    });

    describe('and pressing arrow right on the menu trigger link', () => {
      it('then the correct menu item should receive focus', async () => {
        await getTestContext({ link: { ...defaults.link, url: 'https://www.grafana.com' } });

        await userEvent.tab();
        expect(screen.getAllByRole('link')[0]).toHaveFocus();
        expect(screen.getAllByRole('menuitem')).toHaveLength(3);
        expect(screen.getAllByRole('menuitem')[0]).toHaveAttribute('tabIndex', '-1');
        expect(screen.getAllByRole('menuitem')[1]).toHaveAttribute('tabIndex', '-1');
        expect(screen.getAllByRole('menuitem')[2]).toHaveAttribute('tabIndex', '-1');

        await userEvent.keyboard('{ArrowRight}');
        expect(screen.getAllByRole('link')[0]).not.toHaveFocus();
        expect(screen.getAllByRole('menuitem')).toHaveLength(3);
        expect(screen.getAllByRole('menuitem')[0]).toHaveAttribute('tabIndex', '0');
        expect(screen.getAllByRole('menuitem')[1]).toHaveAttribute('tabIndex', '-1');
        expect(screen.getAllByRole('menuitem')[2]).toHaveAttribute('tabIndex', '-1');
      });
    });

    describe('and pressing arrow left on a menu item', () => {
      it('then the nav bar item should receive focus', async () => {
        await getTestContext({ link: { ...defaults.link, url: 'https://www.grafana.com' } });

        await userEvent.tab();
        await userEvent.keyboard('{ArrowRight}');
        expect(screen.getAllByRole('link')[0]).not.toHaveFocus();
        expect(screen.getAllByRole('menuitem')).toHaveLength(3);
        expect(screen.getAllByRole('menuitem')[0]).toHaveAttribute('tabIndex', '0');
        expect(screen.getAllByRole('menuitem')[1]).toHaveAttribute('tabIndex', '-1');
        expect(screen.getAllByRole('menuitem')[2]).toHaveAttribute('tabIndex', '-1');

        await userEvent.keyboard('{ArrowLeft}');
        expect(screen.getAllByRole('link')[0]).toHaveFocus();
        expect(screen.getAllByRole('menuitem')).toHaveLength(3);
        expect(screen.getAllByRole('menuitem')[0]).toHaveAttribute('tabIndex', '-1');
        expect(screen.getAllByRole('menuitem')[1]).toHaveAttribute('tabIndex', '-1');
        expect(screen.getAllByRole('menuitem')[2]).toHaveAttribute('tabIndex', '-1');
      });
    });

    describe('when appSubUrl is configured and user clicks on menuitem link', () => {
      it('then location service should be called with correct url', async () => {
        const { pushMock } = await getTestContext(
          {
            link: {
              ...defaults.link,
              url: 'https://www.grafana.com',
              children: [{ text: 'New', url: '/grafana/dashboard/new', children: [] }],
            },
          },
          '/grafana'
        );

        await userEvent.hover(screen.getByRole('link'));
        await waitFor(() => {
          expect(screen.getByText('Parent Node')).toBeInTheDocument();
          expect(screen.getByText('New')).toBeInTheDocument();
        });

        await userEvent.click(screen.getByText('New'));
        await waitFor(() => {
          expect(pushMock).toHaveBeenCalledTimes(1);
          expect(pushMock).toHaveBeenCalledWith('/dashboard/new');
        });
      });
    });

    describe('when appSubUrl is not configured and user clicks on menuitem link', () => {
      it('then location service should be called with correct url', async () => {
        const { pushMock } = await getTestContext({
          link: {
            ...defaults.link,
            url: 'https://www.grafana.com',
            children: [{ text: 'New', url: '/grafana/dashboard/new', children: [] }],
          },
        });

        await userEvent.hover(screen.getByRole('link'));
        await waitFor(() => {
          expect(screen.getByText('Parent Node')).toBeInTheDocument();
          expect(screen.getByText('New')).toBeInTheDocument();
        });

        await userEvent.click(screen.getByText('New'));
        await waitFor(() => {
          expect(pushMock).toHaveBeenCalledTimes(1);
          expect(pushMock).toHaveBeenCalledWith('/grafana/dashboard/new');
        });
      });
    });
  });
});
