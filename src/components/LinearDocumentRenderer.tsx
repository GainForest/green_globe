"use client";
import React from "react";
import { cn } from "@/lib/utils";
import type * as PubLeafletPagesLinearDocument from "@/../lexicon-api/types/pub/leaflet/pages/linearDocument";
import type * as PubLeafletBlocksText from "@/../lexicon-api/types/pub/leaflet/blocks/text";
import type * as PubLeafletBlocksHeader from "@/../lexicon-api/types/pub/leaflet/blocks/header";
import type * as PubLeafletBlocksBlockquote from "@/../lexicon-api/types/pub/leaflet/blocks/blockquote";
import type * as PubLeafletBlocksCode from "@/../lexicon-api/types/pub/leaflet/blocks/code";
import type * as PubLeafletBlocksUnorderedList from "@/../lexicon-api/types/pub/leaflet/blocks/unorderedList";

type AlignmentClass = "text-left" | "text-center" | "text-right" | "text-justify";

function getAlignmentClass(alignment: string | undefined): AlignmentClass | undefined {
  switch (alignment) {
    case "lex:pub.leaflet.pages.linearDocument#textAlignLeft":
      return "text-left";
    case "lex:pub.leaflet.pages.linearDocument#textAlignCenter":
      return "text-center";
    case "lex:pub.leaflet.pages.linearDocument#textAlignRight":
      return "text-right";
    case "lex:pub.leaflet.pages.linearDocument#textAlignJustify":
      return "text-justify";
    default:
      return undefined;
  }
}

function renderBlock(
  block: PubLeafletPagesLinearDocument.Block,
  index: number
): React.ReactNode {
  const alignmentClass = getAlignmentClass(block.alignment);
  const inner = block.block;

  switch (inner.$type) {
    case "pub.leaflet.blocks.text": {
      const textBlock = inner as PubLeafletBlocksText.Main;
      return (
        <p
          key={index}
          className={cn(
            alignmentClass,
            textBlock.textSize === "small" && "text-sm",
            textBlock.textSize === "large" && "text-lg"
          )}
        >
          {textBlock.plaintext}
        </p>
      );
    }

    case "pub.leaflet.blocks.header": {
      const headerBlock = inner as PubLeafletBlocksHeader.Main;
      const level = headerBlock.level ?? 2;
      const Tag = (`h${Math.min(Math.max(level, 2), 6)}` as "h2" | "h3" | "h4" | "h5" | "h6");
      return (
        <Tag key={index} className={cn(alignmentClass)}>
          {headerBlock.plaintext}
        </Tag>
      );
    }

    case "pub.leaflet.blocks.blockquote": {
      const blockquoteBlock = inner as PubLeafletBlocksBlockquote.Main;
      return (
        <blockquote
          key={index}
          className={cn(
            "border-l-2 border-muted-foreground pl-4 italic",
            alignmentClass
          )}
        >
          {blockquoteBlock.plaintext}
        </blockquote>
      );
    }

    case "pub.leaflet.blocks.code": {
      const codeBlock = inner as PubLeafletBlocksCode.Main;
      return (
        <pre
          key={index}
          className={cn("bg-muted p-3 rounded-md overflow-x-auto", alignmentClass)}
        >
          <code>{codeBlock.plaintext}</code>
        </pre>
      );
    }

    case "pub.leaflet.blocks.horizontalRule": {
      return <hr key={index} className={cn("border-border", alignmentClass)} />;
    }

    case "pub.leaflet.blocks.image": {
      return (
        <div
          key={index}
          className={cn("bg-muted p-4 rounded-md text-center", alignmentClass)}
        >
          Image
        </div>
      );
    }

    case "pub.leaflet.blocks.unorderedList": {
      const listBlock = inner as PubLeafletBlocksUnorderedList.Main;
      return (
        <ul key={index} className={cn("list-disc pl-6", alignmentClass)}>
          {listBlock.children.map((item, itemIndex) => {
            const content = item.content;
            const plaintext =
              "plaintext" in content ? (content as { plaintext: string }).plaintext : "";
            return <li key={itemIndex}>{plaintext}</li>;
          })}
        </ul>
      );
    }

    default:
      return null;
  }
}

type Props = {
  document: PubLeafletPagesLinearDocument.Main;
};

const LinearDocumentRenderer = ({ document }: Props) => {
  return (
    <div className="flex flex-col gap-2">
      {document.blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
};

export default LinearDocumentRenderer;
