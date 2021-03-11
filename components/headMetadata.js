import { Component } from "react"
import Head from "next/head"

export default class extends Component {
  render() {
    return (
      <Head>
        <title>{this.props.title}</title>
        <meta
          name="description"
          content={this.props.description}
        />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#ffffff" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="google-site-verification" content="CgSAnRLm91TFKD86oDdRfIlwLU5yKSd-rqtD6N_V7Zs" />
        <meta name="msvalidate.01" content="34B372CB2F29AB3CE9F79314ED835554" />
      </Head>
    )
  }
}
