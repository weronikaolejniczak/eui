/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, {
  createElement,
  HTMLAttributes,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  useCallback,
  useRef,
  forwardRef,
} from 'react';
import unified, { PluggableList, Processor } from 'unified';
import { VFileMessage } from 'vfile-message';
import classNames from 'classnames';

import { useEuiMemoizedStyles, useGeneratedHtmlId } from '../../services';
import { CommonProps, OneOf } from '../common';
import { EuiModal } from '../modal';
import { EuiResizeObserver } from '../observer/resize_observer';

import MarkdownActions, { insertText } from './markdown_actions';
import {
  EuiMarkdownEditorToolbar,
  EuiMarkdownEditorToolbarProps,
} from './markdown_editor_toolbar';
import {
  EuiMarkdownEditorTextArea,
  EuiMarkdownEditorTextAreaProps,
} from './markdown_editor_text_area';
import { EuiMarkdownFormat, EuiMarkdownFormatProps } from './markdown_format';
import { EuiMarkdownEditorDropZone } from './markdown_editor_drop_zone';
import { MARKDOWN_MODE, MODE_EDITING, MODE_VIEWING } from './markdown_modes';
import {
  EuiMarkdownAstNode,
  EuiMarkdownDropHandler,
  EuiMarkdownEditorUiPlugin,
  EuiMarkdownParseError,
  EuiMarkdownStringTagConfig,
} from './markdown_types';
import { ContextShape, EuiMarkdownContext } from './markdown_context';
import {
  defaultParsingPlugins,
  defaultProcessingPlugins,
  defaultUiPlugins,
} from './plugins/markdown_default_plugins';
import { euiMarkdownEditorStyles } from './markdown_editor.styles';

type CommonMarkdownEditorProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'placeholder'
> &
  CommonProps & {
    /** aria-label OR aria-labelledby must be set */
    'aria-label'?: string;

    /** aria-label OR aria-labelledby must be set */
    'aria-labelledby'?: string;

    /** ID of an element describing the text editor, useful for associating error messages */
    'aria-describedby'?: string;

    /** a unique ID to attach to the textarea. If one isn't provided, a random one
     * will be generated */
    editorId?: string;

    /** A markdown content */
    value: string;

    /** callback function when markdown content is modified */
    onChange: (value: string) => void;

    /**
     * Sets the current display mode to a read-only state. All editing gets resctricted.
     */
    readOnly?: ContextShape['readOnly'];

    /**
     * Sets the `height` in pixels of the editor/preview area or pass `full` to allow
     * the EuiMarkdownEditor to fill the height of its container.
     * When in `full` mode the vertical resize is not allowed.
     */
    height?: number | 'full';

    /**
     * Sets the `max-height` in pixels of the editor/preview area.
     * It has no effect when the `height` is set to `full`.
     */
    maxHeight?: number;

    /**
     * Automatically adjusts the preview height to fit all the content and avoid a scrollbar.
     */
    autoExpandPreview?: boolean;

    /** plugins to identify new syntax and parse it into an AST node */
    parsingPluginList?: PluggableList;

    /** plugins to process the markdown AST nodes into a React nodes */
    processingPluginList?: PluggableList;

    /** defines UI for plugins' buttons in the toolbar as well as any modals or extra UI that provides content to the editor */
    uiPlugins?: EuiMarkdownEditorUiPlugin[];

    /** errors to bubble up */
    errors?: EuiMarkdownParseError[];

    /** callback triggered when parsing results are available */
    onParse?: (
      error: EuiMarkdownParseError | null,
      data: {
        messages: VFileMessage[];
        ast: EuiMarkdownAstNode;
      }
    ) => void;

    /** initial display mode for the editor */
    initialViewMode?: MARKDOWN_MODE;

    /** array defining any drag&drop handlers */
    dropHandlers?: EuiMarkdownDropHandler[];

    /**
     * Sets the placeholder of the textarea
     */
    placeholder?: EuiMarkdownEditorTextAreaProps['placeholder'];

    /**
     * Further extend the props applied to EuiMarkdownFormat
     */
    markdownFormatProps?: Omit<
      EuiMarkdownFormatProps,
      'parsingPluginList' | 'processingPluginList' | 'children'
    >;
    /**
     * Props to customize the toolbar. `right` replaces the default preview/editor toggle with custom content.
     */
    toolbarProps?: {
      right?: EuiMarkdownEditorToolbarProps['right'];
    };
    /** Controls whether the footer is shown */
    showFooter?: boolean;
  };

export type EuiMarkdownEditorProps = OneOf<
  CommonMarkdownEditorProps,
  'aria-label' | 'aria-labelledby'
>;

// TODO I wanted to use the useCombinedRefs
// but I can't because it's not allowed to use react hooks
// inside a callback.
const mergeRefs = (...refs: any[]) => {
  const filteredRefs = refs.filter(Boolean);
  if (!filteredRefs.length) return null;
  if (filteredRefs.length === 0) return filteredRefs[0];
  return (inst: any) => {
    for (const ref of filteredRefs) {
      if (typeof ref === 'function') {
        ref(inst);
      } else if (ref) {
        ref.current = inst;
      }
    }
  };
};

export interface EuiMarkdownEditorRef {
  textarea: HTMLTextAreaElement | null;
  replaceNode: ContextShape['replaceNode'];
}

function isNewLine(char: string | undefined): boolean {
  if (char == null) return true;
  return !!char.match(/[\r\n]/);
}
function padWithNewlinesIfNeeded(textarea: HTMLTextAreaElement, text: string) {
  const selectionStart = textarea.selectionStart;
  const selectionEnd = textarea.selectionEnd;

  // block parsing requires two leading new lines and none trailing, but we add an extra trailing line for readability
  const isPrevNewLine = isNewLine(textarea.value[selectionStart - 1]);
  const isPrevPrevNewLine = isNewLine(textarea.value[selectionStart - 2]);
  const isNextNewLine = isNewLine(textarea.value[selectionEnd]);

  // pad text with newlines as needed
  text = `${isPrevNewLine ? '' : '\n'}${isPrevPrevNewLine ? '' : '\n'}${text}${
    isNextNewLine ? '' : '\n'
  }`;
  return text;
}

export const EuiMarkdownEditor = forwardRef<
  EuiMarkdownEditorRef,
  EuiMarkdownEditorProps
>(
  (
    {
      className,
      editorId: _editorId,
      value,
      onChange,
      height = 250,
      maxHeight = 500,
      autoExpandPreview = true,
      parsingPluginList = defaultParsingPlugins,
      processingPluginList = defaultProcessingPlugins,
      uiPlugins = defaultUiPlugins,
      onParse,
      errors = [],
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      initialViewMode = MODE_EDITING,
      dropHandlers = [],
      markdownFormatProps,
      placeholder,
      readOnly,
      toolbarProps,
      showFooter = true,
      ...rest
    },
    ref
  ) => {
    const [viewMode, setViewMode] = useState<MARKDOWN_MODE>(initialViewMode);
    const editorId = useGeneratedHtmlId({ conditionalId: _editorId });

    const [pluginEditorPlugin, setPluginEditorPlugin] = useState<
      EuiMarkdownEditorUiPlugin | undefined
    >(undefined);

    const toolbarPlugins = [...uiPlugins];

    const markdownActions = useMemo(
      () => new MarkdownActions(editorId, toolbarPlugins),
      // toolbarPlugins _is_ accounted for
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [editorId, toolbarPlugins.map(({ name }) => name).join(',')]
    );

    const parser = useMemo(() => {
      const Compiler = (tree: any) => {
        return tree;
      };

      function identityCompiler(this: Processor) {
        this.Compiler = Compiler;
      }
      return unified().use(parsingPluginList).use(identityCompiler);
    }, [parsingPluginList]);

    const [parsed, parseError] = useMemo<
      [any | null, EuiMarkdownParseError | null]
    >(() => {
      try {
        const parsed = parser.processSync(value);
        return [parsed, null];
      } catch (e) {
        return [null, e as EuiMarkdownParseError];
      }
    }, [parser, value]);

    const isPreviewing = viewMode === MODE_VIEWING;
    const isEditing = viewMode === MODE_EDITING;

    const replaceNode = useCallback<ContextShape['replaceNode']>(
      (position, next) => {
        const leading = value.substring(0, position.start.offset);
        const trailing = value.substring(position.end.offset);
        onChange(`${leading}${next}${trailing}`);
      },
      [value, onChange]
    );

    const contextValue = useMemo<ContextShape>(
      () => ({
        openPluginEditor: readOnly
          ? () => {}
          : (plugin: EuiMarkdownEditorUiPlugin) =>
              setPluginEditorPlugin(() => plugin),
        replaceNode: readOnly ? () => {} : replaceNode,
        readOnly: readOnly,
      }),
      [replaceNode, readOnly]
    );

    const [selectedNode, setSelectedNode] = useState<EuiMarkdownAstNode>();

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      if (textareaRef == null) return;
      if (parsed == null) return;

      const getCursorNode = () => {
        const { selectionStart } = textareaRef.current!;

        let node: EuiMarkdownAstNode = parsed.result ?? parsed.contents;

        outer: while (true) {
          if (node.children) {
            for (let i = 0; i < node.children.length; i++) {
              const child = node.children[i];
              if (
                child.position &&
                child.position.start.offset < selectionStart &&
                selectionStart < child.position.end.offset
              ) {
                if (child.type === 'text') break outer; // don't dive into `text` nodes
                node = child;
                continue outer;
              }
            }
          }
          break;
        }

        setSelectedNode(node);
      };
      // `parsed` changed, which means the node at the cursor may be different
      // e.g. from clicking a toolbar button
      getCursorNode();

      const textarea = textareaRef.current!;

      textarea.addEventListener('keyup', getCursorNode);
      textarea.addEventListener('mouseup', getCursorNode);

      return () => {
        textarea.removeEventListener('keyup', getCursorNode);
        textarea.removeEventListener('mouseup', getCursorNode);
      };
    }, [parsed]);

    useEffect(() => {
      if (onParse) {
        const messages = parsed ? parsed.messages : [];
        const ast = parsed ? parsed.result ?? parsed.contents : null;
        onParse(parseError, { messages, ast });
      }
    }, [onParse, parsed, parseError]);

    useImperativeHandle(
      ref,
      () => ({ textarea: textareaRef.current, replaceNode }),
      [replaceNode]
    );

    const textarea = textareaRef.current;
    const previewRef = useRef<HTMLDivElement>(null);
    const editorToolbarRef = useRef<HTMLDivElement>(null);
    const [hasUnacceptedItems, setHasUnacceptedItems] = React.useState(false);
    const [currentHeight, setCurrentHeight] = useState(height);
    const [editorFooterHeight, setEditorFooterHeight] = useState(0);
    const [editorToolbarHeight, setEditorToolbarHeight] = useState(0);

    const styles = useEuiMemoizedStyles(euiMarkdownEditorStyles);
    const cssStyles = [
      styles.euiMarkdownEditor,
      height === 'full' && styles.fullHeight,
    ];

    const classes = classNames(
      'euiMarkdownEditor',
      { 'euiMarkdownEditor-isPreviewing': isPreviewing },
      className
    );

    const classesPreview = classNames('euiMarkdownEditorPreview', {
      'euiMarkdownEditorPreview-isReadOnly': readOnly,
    });

    const onResize = () => {
      if (textarea && isEditing && height !== 'full') {
        const resizedTextareaHeight =
          textarea.offsetHeight + editorFooterHeight;

        setCurrentHeight(resizedTextareaHeight);
      }
    };

    useEffect(() => {
      setEditorToolbarHeight(editorToolbarRef.current!.offsetHeight);
    }, [setEditorToolbarHeight]);

    useEffect(() => {
      if (height === 'full' || currentHeight === 'full') return;

      if (
        isPreviewing &&
        autoExpandPreview &&
        previewRef.current!.scrollHeight > currentHeight
      ) {
        // scrollHeight does not include the border or margin
        // so we ask for the computed value for those,
        // which is always in pixels because getComputedValue
        // returns the resolved values
        const elementComputedStyle = window.getComputedStyle(
          previewRef.current!
        );
        const borderWidth =
          parseFloat(elementComputedStyle.borderTopWidth) +
          parseFloat(elementComputedStyle.borderBottomWidth);
        const marginWidth =
          parseFloat(elementComputedStyle.marginTop) +
          parseFloat(elementComputedStyle.marginBottom);

        // then add an extra pixel for safety and because the scrollHeight value is rounded
        const extraHeight = borderWidth + marginWidth + 1;

        setCurrentHeight(previewRef.current!.scrollHeight + extraHeight);
      }
    }, [currentHeight, isPreviewing, height, autoExpandPreview]);

    const previewHeight =
      height === 'full'
        ? `calc(100% - ${editorFooterHeight}px)`
        : currentHeight;

    const textAreaHeight =
      height === 'full' ? '100%' : `calc(${height - editorFooterHeight}px)`;

    const textAreaMaxHeight =
      height !== 'full' ? `${maxHeight - editorFooterHeight}px` : '';

    // safari needs this calc when the height is set to full
    const editorToggleContainerHeight = `calc(100% - ${editorToolbarHeight}px)`;

    return (
      <EuiMarkdownContext.Provider value={contextValue}>
        <div className={classes} css={cssStyles} {...rest}>
          <EuiMarkdownEditorToolbar
            ref={editorToolbarRef}
            selectedNode={selectedNode}
            markdownActions={markdownActions}
            onClickPreview={() =>
              setViewMode(isPreviewing ? MODE_EDITING : MODE_VIEWING)
            }
            viewMode={viewMode}
            uiPlugins={toolbarPlugins}
            {...toolbarProps}
          />

          {isPreviewing && (
            <div
              ref={previewRef}
              className={classesPreview}
              css={styles.euiMarkdownEditorPreview}
              style={{ height: previewHeight }}
            >
              <EuiMarkdownFormat
                parsingPluginList={parsingPluginList}
                processingPluginList={processingPluginList}
                {...markdownFormatProps}
              >
                {value}
              </EuiMarkdownFormat>
            </div>
          )}
          {/* Toggle the editor's display instead of unmounting to retain its undo/redo history */}
          <div
            className="euiMarkdownEditor__toggleContainer"
            style={{
              height: editorToggleContainerHeight,
              display: isPreviewing ? 'none' : undefined,
            }}
          >
            <EuiMarkdownEditorDropZone
              setEditorFooterHeight={setEditorFooterHeight}
              isEditing={isEditing}
              dropHandlers={dropHandlers}
              insertText={(
                text: string,
                config: EuiMarkdownStringTagConfig
              ) => {
                if (config.block) {
                  text = padWithNewlinesIfNeeded(textareaRef.current!, text);
                }

                const originalSelectionStart =
                  textareaRef.current!.selectionStart;
                const newSelectionPoint = originalSelectionStart + text.length;

                insertText(textareaRef.current!, {
                  text,
                  selectionStart: newSelectionPoint,
                  selectionEnd: newSelectionPoint,
                });
              }}
              showFooter={showFooter}
              uiPlugins={toolbarPlugins}
              errors={errors}
              hasUnacceptedItems={hasUnacceptedItems}
              setHasUnacceptedItems={setHasUnacceptedItems}
            >
              <EuiResizeObserver onResize={onResize}>
                {(resizeRef) => {
                  return (
                    <EuiMarkdownEditorTextArea
                      height={textAreaHeight}
                      maxHeight={textAreaMaxHeight}
                      ref={mergeRefs(textareaRef, resizeRef)}
                      id={editorId}
                      onChange={(e) => onChange(e.target.value)}
                      value={value}
                      onFocus={() => setHasUnacceptedItems(false)}
                      placeholder={placeholder}
                      readOnly={readOnly}
                      {...{
                        'aria-label': ariaLabel,
                        'aria-labelledby': ariaLabelledBy,
                        'aria-describedby': ariaDescribedBy,
                      }}
                    />
                  );
                }}
              </EuiResizeObserver>
            </EuiMarkdownEditorDropZone>

            {pluginEditorPlugin && (
              <EuiModal onClose={() => setPluginEditorPlugin(undefined)}>
                {createElement(pluginEditorPlugin.editor!, {
                  node:
                    selectedNode &&
                    selectedNode.type === pluginEditorPlugin.name
                      ? selectedNode
                      : null,
                  onCancel: () => setPluginEditorPlugin(undefined),
                  onSave: (markdown, config) => {
                    if (
                      selectedNode &&
                      selectedNode.type === pluginEditorPlugin.name &&
                      selectedNode.position
                    ) {
                      // modifying an existing node
                      textareaRef.current!.setSelectionRange(
                        selectedNode.position.start.offset,
                        selectedNode.position.end.offset
                      );
                    } else {
                      // creating a new node
                      if (config.block) {
                        // inject newlines if needed
                        markdown = padWithNewlinesIfNeeded(
                          textareaRef.current!,
                          markdown
                        );
                      }
                    }
                    insertText(textareaRef.current!, {
                      text: markdown,
                      selectionStart: undefined,
                      selectionEnd: undefined,
                    });
                    setPluginEditorPlugin(undefined);
                  },
                })}
              </EuiModal>
            )}
          </div>
        </div>
      </EuiMarkdownContext.Provider>
    );
  }
);
EuiMarkdownEditor.displayName = 'EuiMarkdownEditor';
