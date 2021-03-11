import { Component } from "react"
import Highlighter from "react-highlight-words"

import "../../styles/components/search/comment.css"

import renderCreatedTime from "../../utils/renderCreatedTime.js"
import truncateItemTitle from "../../utils/truncateItemTitle.js"

export default class extends Component {
  highlightText = (text) => {
    return (
      <Highlighter
        searchWords={this.props.searchQuery ? this.props.searchQuery.trim().split(" ") : [""]}
        textToHighlight={text}
        highlightClassName="search-highlighted-text"
      />
    )
  }

  renderCommentFormattedText = (comment) => {
    let textToRender

    if (comment._highlightResult && comment._highlightResult.text.matchedWords.length) {
      textToRender = comment._highlightResult.text.value
    } else {
      textToRender = comment.text
    }

    return (
      <span dangerouslySetInnerHTML={{ __html: textToRender }}></span>
    )
  }

  render () {
    const comment = this.props.comment

    return (
      <div className="search-results-comment">
        <div className="search-results-comment-details">
          <span>
            <a href={`/user?id=${comment.by}`}>
              {this.highlightText(comment.by)}
            </a>
          </span>
          <span className="search-results-comment-details-separator">|</span>
          <span>
            <a href={`/comment?id=${comment.objectID}`}>
              {renderCreatedTime(comment.created)}
            </a>
          </span>
          <span className="search-results-comment-details-separator">|</span>
          <a href={comment.isParent ? `/item?id=${comment.parentItemId}` : `/comment?id=${comment.objectID}`}>parent</a>
          <span className="search-results-comment-details-separator">|</span>
          <span>
            on: <a href={`/item?id=${comment.parentItemId}`}>{this.highlightText(truncateItemTitle(comment.parentItemTitle))}</a>
          </span>
        </div>
        <div className="search-results-comment-text">
          {this.renderCommentFormattedText(comment)}
        </div>
      </div>
    )
  }
}
